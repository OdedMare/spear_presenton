export const getHeader = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Add Authorization header if session token exists
  if (typeof window !== "undefined") {
    const sessionToken = localStorage.getItem("sessionToken");
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }
  }

  return headers;
};

export const getHeaderForFormData = () => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Add Authorization header if session token exists
  if (typeof window !== "undefined") {
    const sessionToken = localStorage.getItem("sessionToken");
    if (sessionToken) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }
  }

  return headers;
};
