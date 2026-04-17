import { REST, Routes } from "discord.js";

export interface MessageFetchOptions {
  limit?: number;
  after?: string;
  before?: string;
}

export interface SendOptions {
  embeds?: Array<Record<string, unknown>>;
  reply?: string;
}

/**
 * Thin wrapper around Discord REST API.
 * Uses REST-only (no gateway) for CLI commands to stay lightweight.
 */
export class DiscordClient {
  private rest: REST;

  constructor(token: string) {
    this.rest = new REST({ version: "10" }).setToken(token);
  }

  // ── Identity ────────────────────────────────────────────────

  async getMe(): Promise<Record<string, any>> {
    return this.rest.get(Routes.user()) as Promise<Record<string, any>>;
  }

  // ── Guilds ──────────────────────────────────────────────────

  async listGuilds(): Promise<Array<Record<string, any>>> {
    return this.rest.get(Routes.userGuilds()) as Promise<Array<Record<string, any>>>;
  }

  async getGuild(guildId: string): Promise<Record<string, any>> {
    return this.rest.get(Routes.guild(guildId), {
      query: new URLSearchParams({ with_counts: "true" }),
    }) as Promise<Record<string, any>>;
  }

  // ── Channels ────────────────────────────────────────────────

  async listChannels(guildId: string): Promise<Array<Record<string, any>>> {
    return this.rest.get(Routes.guildChannels(guildId)) as Promise<Array<Record<string, any>>>;
  }

  async getChannel(channelId: string): Promise<Record<string, any>> {
    return this.rest.get(Routes.channel(channelId)) as Promise<Record<string, any>>;
  }

  // ── Messages ────────────────────────────────────────────────

  async getMessages(
    channelId: string,
    opts: MessageFetchOptions = {}
  ): Promise<Array<Record<string, any>>> {
    const params = new URLSearchParams({ limit: String(opts.limit ?? 50) });
    if (opts.after) params.set("after", opts.after);
    if (opts.before) params.set("before", opts.before);
    return this.rest.get(Routes.channelMessages(channelId), {
      query: params,
    }) as Promise<Array<Record<string, any>>>;
  }

  async sendMessage(
    channelId: string,
    content: string | null,
    opts: SendOptions = {}
  ): Promise<Record<string, any>> {
    const body: Record<string, unknown> = {};
    if (content) body.content = content;
    if (opts.embeds) body.embeds = opts.embeds;
    if (opts.reply) body.message_reference = { message_id: opts.reply };
    return this.rest.post(Routes.channelMessages(channelId), {
      body,
    }) as Promise<Record<string, any>>;
  }

  // ── Members ─────────────────────────────────────────────────

  async listMembers(
    guildId: string,
    opts: { limit?: number } = {}
  ): Promise<Array<Record<string, any>>> {
    const params = new URLSearchParams({ limit: String(opts.limit ?? 100) });
    return this.rest.get(Routes.guildMembers(guildId), {
      query: params,
    }) as Promise<Array<Record<string, any>>>;
  }

  // ── Roles ───────────────────────────────────────────────────

  async listRoles(guildId: string): Promise<Array<Record<string, any>>> {
    return this.rest.get(Routes.guildRoles(guildId)) as Promise<Array<Record<string, any>>>;
  }

  // ── Reactions ───────────────────────────────────────────────

  async addReaction(
    channelId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const encoded = encodeURIComponent(emoji);
    await this.rest.put(
      `/channels/${channelId}/messages/${messageId}/reactions/${encoded}/@me`
    );
  }

  // ── Pins ────────────────────────────────────────────────────

  async getPins(channelId: string): Promise<Array<Record<string, any>>> {
    return this.rest.get(Routes.channelPins(channelId)) as Promise<Array<Record<string, any>>>;
  }

  // ── Threads ─────────────────────────────────────────────────

  async listActiveThreads(
    guildId: string
  ): Promise<{ threads: Array<Record<string, any>> }> {
    return this.rest.get(Routes.guildActiveThreads(guildId)) as Promise<{
      threads: Array<Record<string, any>>;
    }>;
  }

  // ── Application ─────────────────────────────────────────────

  async getApplication(): Promise<Record<string, any>> {
    return this.rest.get("/applications/@me") as Promise<Record<string, any>>;
  }

  async updateApplication(
    body: Record<string, unknown>
  ): Promise<Record<string, any>> {
    return this.rest.patch("/applications/@me", { body }) as Promise<
      Record<string, any>
    >;
  }
}
