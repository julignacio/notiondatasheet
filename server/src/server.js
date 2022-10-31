import express from "express";
import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const host = "localhost";
const port = 8000;
const { NOTION_DATABASE_ID, NOTION_SECRET } = process.env;
if (!NOTION_DATABASE_ID || !NOTION_SECRET)
    throw Error("Env variables not found");
    
    const app = express();
let authorized = false;
let notion = {}

app.use(cors());
app.use(express.json());

app.post('/auth', (req, res) => {
    const { code } = req.body; 
    try {
        notion = new Client({
            auth: code,
        });
        if(notion) {
            authorized = true;
            return res.json({message: "authorized"})
        }
        return res.json({message: "wrong code"});
    } catch(e) {
        return res.json({message: "wrong code"});
    }
})

app.use((req, res, next) => {
    if(!authorized) return res.status(401).json({
        authorization_url: "https://api.notion.com/v1/oauth/authorize?client_id=141f3936-bc26-44ff-b966-b65d4e539f07&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A3000"
    }); 
})


app.get("/", async (req, res) => {
    const query = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
    });
    const list = query.results.map((row) => {
        const ownerCell = row.properties.Owner;
        const stocksCell = row.properties.Stocks;
        const id = row.id;
        if (stocksCell && ownerCell) {
            const stocks = stocksCell.number;
            let owner = ownerCell.title.map((t) => t.plain_text).join(" ");
            return { owner, stocks, id };
        }
        return { owner: "NOT_FOUND", stocks: 0 };
    });
    res.status(200);
    return res.json(list);
});

app.patch("/edit", async (req, res) => {
    const { owner, stocks, id } = req.body;
    const normalizeProps = (ownerText, stocksNumber) => ({
        Owner: {
            id: "title",
            type: "title",
            title: [
                {
                    type: "text",
                    text: { content: ownerText, link: null },
                    annotations: {
                        bold: false,
                        italic: false,
                        strikethrough: false,
                        underline: false,
                        code: false,
                        color: "default",
                    },
                    plain_text: ownerText,
                    href: null,
                },
            ],
        },
        Stocks: {
            id: "Ss%3BY",
            type: "number",
            number: stocksNumber,
        },
    });
    if (id) {
        const edit = await notion.pages.update({
            page_id: id,
            properties: normalizeProps(owner, stocks),
        });
        return res.json(edit);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
