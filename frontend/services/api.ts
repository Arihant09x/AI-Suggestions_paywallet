const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ) {
    // Handle demo mode
    if (token?.startsWith("demo-jwt-token")) {
      return this.handleDemoRequest(endpoint, options);
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API request failed");
    }

    return response.json();
  }

  private async handleDemoRequest(endpoint: string, options: RequestInit = {}) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const method = options.method || "GET";
    const body = options.body ? JSON.parse(options.body as string) : null;

    // Handle different demo endpoints
    switch (endpoint) {
      case "/account/add-money":
        if (method === "POST") {
          const currentUser = JSON.parse(
            localStorage.getItem("demoUser") || "{}"
          );
          const newBalance = currentUser.balance + body.amount;
          currentUser.balance = newBalance;
          localStorage.setItem("demoUser", JSON.stringify(currentUser));
          return { data: { newBalance } };
        }
        break;

      case "/account/transfer":
        if (method === "POST") {
          const currentUser = JSON.parse(
            localStorage.getItem("demoUser") || "{}"
          );
          const newBalance = currentUser.balance - body.amount;
          currentUser.balance = Math.max(0, newBalance);
          localStorage.setItem("demoUser", JSON.stringify(currentUser));
          return {
            data: {
              senderNewBalance: newBalance,
              transaction: {
                _id: "demo-tx-" + Date.now(),
                amount: body.amount,
                recipient: body.recipient,
                status: "completed",
              },
            },
          };
        }
        break;

      case "/account/transactions":
        if (method === "GET") {
          // Return demo transactions
          return {
            data: {
              transactions: [
                {
                  _id: "demo-tx-1",
                  sender: {
                    username: "Demo User",
                    email: "demo@paywallet.com",
                  },
                  receiver: { username: "John Doe", email: "john@example.com" },
                  amount: 5000,
                  status: "completed",
                  timestamp: new Date(Date.now() - 86400000).toISOString(),
                  type: "sent",
                },
                {
                  _id: "demo-tx-2",
                  sender: { username: "Jane Smith", email: "jane@example.com" },
                  receiver: {
                    username: "Demo User",
                    email: "demo@paywallet.com",
                  },
                  amount: 10000,
                  status: "completed",
                  timestamp: new Date(Date.now() - 172800000).toISOString(),
                  type: "received",
                },
              ],
            },
          };
        }
        break;

      case "/user/profile":
        if (method === "GET") {
          const currentUser = JSON.parse(
            localStorage.getItem("demoUser") || "{}"
          );
          return { data: { user: currentUser } };
        }
        if (method === "PUT") {
          const currentUser = JSON.parse(
            localStorage.getItem("demoUser") || "{}"
          );
          const updatedUser = { ...currentUser, ...body };
          localStorage.setItem("demoUser", JSON.stringify(updatedUser));
          return { data: { user: updatedUser } };
        }
        break;

      default:
        throw new Error("Demo endpoint not implemented");
    }

    return { data: {} };
  }

  async get(endpoint: string, token?: string) {
    return this.request(endpoint, { method: "GET" }, token);
  }

  async post(endpoint: string, data: any, token?: string) {
    return this.request(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
  }

  async put(endpoint: string, data: any, token?: string) {
    return this.request(
      endpoint,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    );
  }

  async delete(endpoint: string, token?: string) {
    return this.request(endpoint, { method: "DELETE" }, token);
  }
}
export async function fetchSmartSuggestion(token: string) {
  try {
    const suggestion = await apiService.post(
      "/account/smart-suggestion",
      {},
      token
    );
    return suggestion;
  } catch {
    return null;
  }
}

export const apiService = new ApiService(API_BASE_URL);
