/**
 * Cliente MCP para o Data Lake Seazone.
 * Chama o MCP server diretamente via HTTP POST.
 */

const MCP_URL = process.env.MCP_DATA_LAKE_URL || "https://ln8gpsqb36.execute-api.us-west-2.amazonaws.com/mcp";
const MCP_TOKEN = process.env.MCP_DATA_LAKE_TOKEN || "";

interface McpResponse {
  result?: string;
  error?: string;
}

async function callMcp(toolName: string, args: Record<string, unknown>): Promise<string> {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MCP_TOKEN}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();

  // MCP retorna result.content[0].text ou result direto
  if (data.result?.content?.[0]?.text) {
    return data.result.content[0].text;
  }
  if (data.result?.result) {
    return typeof data.result.result === "string" ? data.result.result : JSON.stringify(data.result.result);
  }
  if (data.result) {
    return typeof data.result === "string" ? data.result : JSON.stringify(data.result);
  }
  if (data.error) {
    throw new Error(`MCP tool error: ${JSON.stringify(data.error)}`);
  }

  return JSON.stringify(data);
}

export async function mcpQuery(sql: string, source: string, database?: string): Promise<string> {
  const args: Record<string, unknown> = { sql, source };
  if (database) args.database = database;
  return callMcp("query_data", args);
}

export async function mcpGetTablesContext(source: string = "all"): Promise<string> {
  return callMcp("get_tables_context", { source });
}

export async function mcpListDatabases(source: string = "sirius"): Promise<string> {
  return callMcp("list_databases", { source });
}

export async function mcpDescribeTable(database: string, table: string, source: string): Promise<string> {
  return callMcp("describe_table", { database, table, source });
}
