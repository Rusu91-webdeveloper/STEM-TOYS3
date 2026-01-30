export type CourierServiceType = "home" | "easybox";

export interface CourierServiceConfig {
  id: string;
  name: string;
  description: string;
  estimatedDelivery: string;
  methodType: CourierServiceType;
  enabled?: boolean;
  priceOverride?: string;
}

export interface CourierConfig {
  id: string;
  name: string;
  enabled: boolean;
  isDefault?: boolean;
  services: CourierServiceConfig[];
}

export const DEFAULT_COURIERS: CourierConfig[] = [
  {
    id: "fancourier",
    name: "FanCourier",
    enabled: true,
    isDefault: true,
    services: [
      {
        id: "standard",
        name: "FanCourier Standard",
        description: "Livrare la adresa ta",
        estimatedDelivery: "24-48h",
        methodType: "home",
        enabled: true,
      },
      {
        id: "fanbox",
        name: "FanCourier FANbox",
        description: "Livrare la FANbox",
        estimatedDelivery: "24-48h",
        methodType: "easybox",
        enabled: true,
      },
    ],
  },
  {
    id: "sameday",
    name: "Sameday",
    enabled: false,
    services: [
      {
        id: "home",
        name: "Sameday Nextday Home",
        description: "Livrare a doua zi la adresă",
        estimatedDelivery: "24h",
        methodType: "home",
        enabled: true,
      },
      {
        id: "easybox",
        name: "Sameday Easybox",
        description: "Livrare la Easybox",
        estimatedDelivery: "24-48h",
        methodType: "easybox",
        enabled: true,
      },
    ],
  },
];

export const buildShippingMethodId = (courierId: string, serviceId: string) =>
  `${courierId}:${serviceId}`;

export const parseShippingMethodId = (methodId?: string | null) => {
  if (!methodId) return { courierId: null, serviceId: null };
  const [courierId, serviceId] = methodId.split(":");
  return {
    courierId: courierId || null,
    serviceId: serviceId || null,
  };
};

export const getDefaultCourierId = (couriers: CourierConfig[]) => {
  const explicit = couriers.find(courier => courier.isDefault && courier.enabled);
  if (explicit) return explicit.id;
  const firstEnabled = couriers.find(courier => courier.enabled);
  return firstEnabled?.id || null;
};

export const getCourierConfig = (
  couriers: CourierConfig[],
  courierId?: string | null
) => {
  if (!courierId) return null;
  return couriers.find(courier => courier.id === courierId) || null;
};

export const getServiceConfig = (
  courier: CourierConfig,
  serviceId?: string | null
) => {
  if (!serviceId) return null;
  return (
    courier.services.find(service => service.id === serviceId) || null
  );
};
