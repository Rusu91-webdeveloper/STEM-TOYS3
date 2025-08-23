import { NextRequest, NextResponse } from "next/server";

import { performanceMonitor } from "../../../../lib/monitoring/performance-monitor";
import { websocketManager } from "../../../../lib/realtime/websocket-server";

export function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    // Get WebSocket server status
    const status = {
      connected: websocketManager.getConnectedClients(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    // Record metric
    performanceMonitor.recordMetric("websocket", "status_check", Date.now(), {
      userId,
      sessionId,
      connectedClients: status.connected,
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error("WebSocket status error:", error);
    return NextResponse.json(
      { error: "Failed to get WebSocket status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, targetClient, targetChannel } = body;

    let result;

    switch (type) {
      case "broadcast":
        if (targetChannel) {
          websocketManager.broadcastToSubscribers(targetChannel, {
            type: data.type ?? "broadcast",
            data: data.payload,
            timestamp: Date.now(),
          });
          result = {
            success: true,
            message: `Broadcasted to channel: ${targetChannel}`,
          };
        } else {
          websocketManager.broadcastToAll({
            type: data.type ?? "broadcast",
            data: data.payload,
            timestamp: Date.now(),
          });
          result = { success: true, message: "Broadcasted to all clients" };
        }
        break;

      case "send_to_client":
        if (!targetClient) {
          return NextResponse.json(
            { error: "targetClient is required for send_to_client" },
            { status: 400 }
          );
        }
        websocketManager.sendToClient(targetClient, {
          type: data.type ?? "message",
          data: data.payload,
          timestamp: Date.now(),
        });
        result = { success: true, message: `Sent to client: ${targetClient}` };
        break;

      case "get_client_info":
        if (!targetClient) {
          return NextResponse.json(
            { error: "targetClient is required for get_client_info" },
            { status: 400 }
          );
        }
        const clientInfo = websocketManager.getClientInfo(targetClient);
        result = { success: true, clientInfo };
        break;

      case "get_connected_clients":
        const connectedClients = websocketManager.getConnectedClients();
        result = { success: true, connectedClients };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation type: ${type}` },
          { status: 400 }
        );
    }

    // Record metric
    performanceMonitor.recordMetric("websocket", "api_operation", Date.now(), {
      operation: type,
      targetClient,
      targetChannel,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("WebSocket API error:", error);
    return NextResponse.json(
      { error: "Failed to process WebSocket operation" },
      { status: 500 }
    );
  }
}
