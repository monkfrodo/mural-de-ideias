import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

// Read env at request time: on Cloudflare Workers process.env is only populated per request.
const getNotion = () => new Client({ auth: process.env.NOTION_TOKEN?.trim() });

export async function GET() {
  try {
    const notion = getNotion();
    const dataSourceId = process.env.NOTION_DATASOURCE_ID!.trim();
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const ideas = response.results.map((page: any) => ({
      id: page.id,
      name: page.properties.Nome?.title?.[0]?.plain_text ?? "",
      message: page.properties.Mensagem?.rich_text?.[0]?.plain_text ?? "",
      color: page.properties.Cor?.select?.name ?? "yellow",
      rotation: page.properties.Rotacao?.number ?? 0,
      createdAt: page.created_time,
    }));

    return NextResponse.json(ideas);
  } catch (error: any) {
    console.error("Notion GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const notion = getNotion();
    const databaseId = process.env.NOTION_DATABASE_ID!.trim();
    const { name, message, color, rotation } = await request.json();

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Nome e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Nome: { title: [{ text: { content: name.trim() } }] },
        Mensagem: { rich_text: [{ text: { content: message.trim() } }] },
        Cor: { select: { name: color } },
        Rotacao: { number: rotation },
      },
    });

    return NextResponse.json({
      id: page.id,
      name: name.trim(),
      message: message.trim(),
      color,
      rotation,
    });
  } catch (error: any) {
    console.error("Notion POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
