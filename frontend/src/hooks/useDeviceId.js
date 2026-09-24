import { useState, useEffect } from "react";

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState("default-device");

  useEffect(() => {
    let id = localStorage.getItem("dealsradar_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      localStorage.setItem("dealsradar_device_id", id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
}
