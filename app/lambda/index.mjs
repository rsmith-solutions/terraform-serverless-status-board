import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const TABLE_NAME = process.env.TABLE_NAME;

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({}),
  {
    marshallOptions: { removeUndefinedValues: true }
  }
);

function json(statusCode, bodyObj, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      ...extraHeaders
    },
    body: JSON.stringify(bodyObj)
  };
}

function nowIso() {
  return new Date().toISOString();
}

export async function handler(event) {
  try {
    const method = event?.requestContext?.http?.method || event?.httpMethod;
    const rawPath = event?.rawPath || event?.path || "/";
    const pathParams = event?.pathParameters || {};

    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        body: ""
      };
    }

    if (method === "GET" && rawPath === "/services") {
      const resp = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
      return json(200, { items: resp.Items || [] });
    }

    if (method === "POST" && rawPath === "/services") {
      const body = event.body ? JSON.parse(event.body) : {};
      if (!body.name) return json(400, { error: "name required" });

      const item = {
        id: randomUUID(),
        name: body.name,
        description: body.description || "",
        status: body.status || "OPERATIONAL",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };

      await ddb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));

      return json(201, { item });
    }

    const id = pathParams.id;

    if (method === "PUT" && id) {
      const body = JSON.parse(event.body);

      await ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
          "#updatedAt": "updatedAt"
        },
        ExpressionAttributeValues: {
          ":status": body.status,
          ":updatedAt": nowIso()
        }
      }));

      return json(200, { message: "updated" });
    }

    if (method === "DELETE" && id) {
      await ddb.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id }
      }));

      return json(204, {});
    }

    return json(404, { error: "not found" });

  } catch (err) {
    console.error(err);
    return json(500, { error: "internal error" });
  }
}
