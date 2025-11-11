const DEFAULT_BASE_URL =
  typeof window !== "undefined" && window.location
    ? ""
    : "http://localhost:4000";

let baseUrl = DEFAULT_BASE_URL;

function buildUrl(path) {
  if (!path.startsWith("/")) {
    throw new Error(`API paths must start with "/": received "${path}"`);
  }

  if (!baseUrl) {
    return path;
  }

  const trimmedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return `${trimmedBase}${path}`;
}

async function request(path, options = {}) {
  const { method = "GET", body, headers = {} } = options;
  const init = { method, headers: { ...headers } };

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    if (!init.headers["Content-Type"]) {
      init.headers["Content-Type"] = "application/json";
    }
  }

  const target = buildUrl(path);
  let response;
  try {
    response = await fetch(target, init);
  } catch (error) {
    throw new Error(
      `Unable to reach Skyjo rooms API at ${target}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const text = await response.text();
  const hasContent = text.length > 0;
  const payload = hasContent ? safeParseJson(text) : null;

  if (!response.ok) {
    const message =
      (payload && payload.error) ||
      (payload && payload.message) ||
      `Request to ${target} failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload ?? undefined;
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Skyjo rooms API returned invalid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export const RoomApi = {
  configure({ baseUrl: nextBaseUrl } = {}) {
    if (typeof nextBaseUrl !== "string") {
      throw new TypeError("RoomApi.configure expects a baseUrl string.");
    }
    baseUrl = nextBaseUrl;
  },

  getBaseUrl() {
    return baseUrl;
  },

  async createRoom(roomId) {
    const normalized = normalizeRoomId(roomId);
    const response = await request("/rooms", {
      method: "POST",
      body: normalized ? { roomId: normalized } : undefined,
    });
    return response;
  },

  async getRoom(roomId) {
    const normalized = normalizeRequiredRoomId(roomId);
    return request(`/rooms/${normalized}`);
  },

  async joinRoom(roomId, name) {
    const normalized = normalizeRequiredRoomId(roomId);
    const safeName = typeof name === "string" ? name.trim() : "";
    return request(`/rooms/${normalized}/join`, {
      method: "POST",
      body: { name: safeName },
    });
  },

  async startGame(roomId) {
    const normalized = normalizeRequiredRoomId(roomId);
    return request(`/rooms/${normalized}/start`, {
      method: "POST",
    });
  },

  async revealInitialCard(roomId, playerName, position) {
    const normalized = normalizeRequiredRoomId(roomId);
    const safeName = typeof playerName === "string" ? playerName.trim() : "";
    if (!safeName) {
      throw new Error("Player name must not be empty.");
    }
    if (!Number.isInteger(position)) {
      throw new Error("Card position must be an integer.");
    }

    return request(`/rooms/${normalized}/initial-flip`, {
      method: "POST",
      body: { playerName: safeName, position },
    });
  },

  async resetRoom(roomId) {
    const normalized = normalizeRequiredRoomId(roomId);
    await request(`/rooms/${normalized}/reset`, {
      method: "POST",
    });
  },
};

function normalizeRoomId(value) {
  if (!value) {
    return "";
  }
  return String(value).trim().toUpperCase();
}

function normalizeRequiredRoomId(value) {
  const normalized = normalizeRoomId(value);
  if (!normalized) {
    throw new Error("Room id must not be empty.");
  }
  return normalized;
}
