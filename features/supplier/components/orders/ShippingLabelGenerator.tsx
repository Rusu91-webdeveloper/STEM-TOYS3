"use client";

import { useState } from "react";
import { 
  Printer, 
  Download, 
  Truck, 
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface ShippingLabelGeneratorProps {
  orderId: string;
  customerAddress: ShippingAddress;
  customerName: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  weight?: number;
  onLabelGenerated?: (trackingNumber: string) => void;
}

const shippingCarriers = [
  { id: "fan", name: "Fan Courier", trackingUrl: "https://www.fancourier.ro/tracking" },
  { id: "urgent", name: "Urgent Cargus", trackingUrl: "https://www.urgentcargus.ro/tracking" },
  { id: "sameday", name: "SameDay", trackingUrl: "https://www.sameday.ro/tracking" },
  { id: "gls", name: "GLS", trackingUrl: "https://gls-group.eu/tracking" },
  { id: "dpd", name: "DPD", trackingUrl: "https://www.dpd.com/tracking" },
  { id: "posta", name: "Poșta Română", trackingUrl: "https://www.posta-romana.ro/tracking" },
];

const packageTypes = [
  { id: "envelope", name: "Envelope", maxWeight: 0.5 },
  { id: "small", name: "Small Package", maxWeight: 2 },
  { id: "medium", name: "Medium Package", maxWeight: 5 },
  { id: "large", name: "Large Package", maxWeight: 10 },
  { id: "heavy", name: "Heavy Package", maxWeight: 30 },
];

export function ShippingLabelGenerator({
  orderId,
  customerAddress,
  customerName,
  customerEmail,
  productName,
  quantity,
  weight = 1,
  onLabelGenerated
}: ShippingLabelGeneratorProps) {
  const { toast } = useToast();
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [selectedPackageType, setSelectedPackageType] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [labelGenerated, setLabelGenerated] = useState(false);

  const calculateShippingCost = () => {
    if (!selectedCarrier || !selectedPackageType) return 0;
    
    const baseCosts = {
      fan: { envelope: 8, small: 12, medium: 18, large: 25, heavy: 35 },
      urgent: { envelope: 9, small: 13, medium: 19, large: 26, heavy: 36 },
      sameday: { envelope: 15, small: 20, medium: 28, large: 35, heavy: 45 },
      gls: { envelope: 10, small: 14, medium: 20, large: 27, heavy: 37 },
      dpd: { envelope: 11, small: 15, medium: 21, large: 28, heavy: 38 },
      posta: { envelope: 7, small: 11, medium: 17, large: 24, heavy: 34 },
    };

    return baseCosts[selectedCarrier as keyof typeof baseCosts]?.[selectedPackageType as keyof typeof baseCosts.fan] || 0;
  };

  const generateTrackingNumber = () => {
    const carrier = shippingCarriers.find(c => c.id === selectedCarrier);
    if (!carrier) return "";

    const prefix = carrier.id.toUpperCase();
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `${prefix}${timestamp}${random}`;
  };

  const handleGenerateLabel = async () => {
    if (!selectedCarrier || !selectedPackageType) {
      toast({
        title: "Error",
        description: "Please select a carrier and package type",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Generate tracking number
      const newTrackingNumber = generateTrackingNumber();
      setTrackingNumber(newTrackingNumber);

      // Simulate API call to generate shipping label
      await new Promise(resolve => setTimeout(resolve, 2000));

      setLabelGenerated(true);
      
      toast({
        title: "Success",
        description: "Shipping label generated successfully",
      });

      // Call callback to update order
      if (onLabelGenerated) {
        onLabelGenerated(newTrackingNumber);
      }
    } catch (error) {
      console.error("Error generating shipping label:", error);
      toast({
        title: "Error",
        description: "Failed to generate shipping label",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintLabel = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Shipping Label - Order ${orderId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .label { border: 2px solid #000; padding: 20px; max-width: 400px; }
              .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin-bottom: 15px; }
              .section h3 { margin: 0 0 5px 0; font-size: 14px; }
              .section p { margin: 0; font-size: 12px; }
              .tracking { background: #f0f0f0; padding: 10px; text-align: center; margin-top: 20px; }
              .barcode { text-align: center; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="header">
                <h2>SHIPPING LABEL</h2>
                <p>Order #${orderId}</p>
              </div>
              
              <div class="section">
                <h3>TO:</h3>
                <p><strong>${customerAddress.fullName}</strong></p>
                <p>${customerAddress.addressLine1}</p>
                ${customerAddress.addressLine2 ? `<p>${customerAddress.addressLine2}</p>` : ""}
                <p>${customerAddress.city}, ${customerAddress.state} ${customerAddress.postalCode}</p>
                <p>${customerAddress.country}</p>
                <p>Phone: ${customerAddress.phone}</p>
              </div>
              
              <div class="section">
                <h3>FROM:</h3>
                <p><strong>TechTots Supplier</strong></p>
                <p>Your Company Name</p>
                <p>Your Address</p>
                <p>Your City, State ZIP</p>
                <p>Romania</p>
              </div>
              
              <div class="section">
                <h3>PACKAGE INFO:</h3>
                <p>Product: ${productName}</p>
                <p>Quantity: ${quantity}</p>
                <p>Weight: ${weight} kg</p>
                <p>Carrier: ${shippingCarriers.find(c => c.id === selectedCarrier)?.name}</p>
              </div>
              
              <div class="tracking">
                <h3>TRACKING NUMBER</h3>
                <p style="font-size: 18px; font-weight: bold;">${trackingNumber}</p>
              </div>
              
              <div class="barcode">
                <p style="font-family: monospace; font-size: 16px;">*${trackingNumber}*</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadLabel = () => {
    // Create a blob with the label data
    const labelData = `
SHIPPING LABEL
Order #${orderId}

TO:
${customerAddress.fullName}
${customerAddress.addressLine1}
${customerAddress.addressLine2 || ""}
${customerAddress.city}, ${customerAddress.state} ${customerAddress.postalCode}
${customerAddress.country}
Phone: ${customerAddress.phone}

FROM:
TechTots Supplier
Your Company Name
Your Address
Your City, State ZIP
Romania

PACKAGE INFO:
Product: ${productName}
Quantity: ${quantity}
Weight: ${weight} kg
Carrier: ${shippingCarriers.find(c => c.id === selectedCarrier)?.name}

TRACKING NUMBER: ${trackingNumber}
    `.trim();

    const blob = new Blob([labelData], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipping-label-${orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const shippingCost = calculateShippingCost();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Label Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="space-y-1 text-sm">
              <p><strong>{customerName}</strong></p>
              <p className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {customerEmail}
              </p>
              <p className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {customerAddress.phone}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </h3>
            <div className="text-sm space-y-1">
              <p>{customerAddress.fullName}</p>
              <p>{customerAddress.addressLine1}</p>
              {customerAddress.addressLine2 && <p>{customerAddress.addressLine2}</p>}
              <p>{customerAddress.city}, {customerAddress.state} {customerAddress.postalCode}</p>
              <p>{customerAddress.country}</p>
            </div>
          </div>
        </div>

        {/* Package Information */}
        <div>
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Package Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Product</label>
              <p className="text-sm">{productName}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <p className="text-sm">{quantity}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Weight (kg)</label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => {/* Handle weight change */}}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Shipping Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Shipping Carrier</label>
            <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {shippingCarriers.map((carrier) => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Package Type</label>
            <Select value={selectedPackageType} onValueChange={setSelectedPackageType}>
              <SelectTrigger>
                <SelectValue placeholder="Select package type" />
              </SelectTrigger>
              <SelectContent>
                {packageTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} (max {type.maxWeight}kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Shipping Cost */}
        {shippingCost > 0 && (
          <div className="bg-muted p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Shipping Cost:</span>
              <span className="text-lg font-bold">{shippingCost.toFixed(2)} RON</span>
            </div>
          </div>
        )}

        {/* Shipping Notes */}
        <div>
          <label className="text-sm font-medium">Shipping Notes</label>
          <Textarea
            value={shippingNotes}
            onChange={(e) => setShippingNotes(e.target.value)}
            placeholder="Add any special instructions for shipping..."
            rows={3}
          />
        </div>

        {/* Generate Label */}
        {!labelGenerated ? (
          <Button 
            onClick={handleGenerateLabel} 
            disabled={generating || !selectedCarrier || !selectedPackageType}
            className="w-full"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Label...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Shipping Label
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Shipping label generated successfully! Tracking number: <strong>{trackingNumber}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={handlePrintLabel} variant="outline" className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Label
              </Button>
              <Button onClick={handleDownloadLabel} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Tracking URL:{" "}
                <a 
                  href={`${shippingCarriers.find(c => c.id === selectedCarrier)?.trackingUrl}?tracking=${trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Track Package
                </a>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
