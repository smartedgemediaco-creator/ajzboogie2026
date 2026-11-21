import PDFDocument from "pdfkit";
import type { EventConfig } from "@/lib/events";

const GOLD = "#d4af37";
const INK = "#0b0d13";
const PAPER = "#f5efe6";
const MUTED = "rgba(245, 239, 230, 0.5)";
const LABEL = "rgba(168, 155, 128, 0.8)";
const CARD = "#161520";
const CARD_BORDER = "rgba(212, 175, 55, 0.35)";

export function generateRSVPPdf(event: EventConfig, name: string, code: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [612, 792],
      margin: 0,
      info: {
        Title: `Invite Pass — ${event.name}`,
        Author: "Afara Digital Solutions",
      },
    });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, 612, 792).fill(INK);

    doc.rect(0, 0, 612, 150).fill(CARD);
    doc.rect(0, 150, 612, 5).fill(GOLD);

    doc.font("Helvetica-Bold").fontSize(24).fillColor(PAPER);
    doc.text(event.name, 0, 52, { width: 612, align: "center" });

    doc.font("Helvetica").fontSize(11).fillColor("#a89b80");
    doc.text("REUNITED IN BROTHERHOOD", 0, 86, { width: 612, align: "center" });

    doc.strokeColor(GOLD).lineWidth(0.8);
    doc.moveTo(140, 116).lineTo(472, 116).stroke();

    doc.font("Helvetica-Bold").fontSize(20).fillColor(PAPER);
    doc.text("You're on the list", 0, 166, { width: 612, align: "center" });

    doc.font("Helvetica").fontSize(13).fillColor(MUTED);
    doc.text(`Thank you, ${name}. We can't wait to share the night with you.`, {
      width: 480,
      align: "center",
    });

    const cardTop = 255;
    doc.roundedRect(40, cardTop, 532, 160, 14).fill(CARD);
    doc.strokeColor(CARD_BORDER).lineWidth(1);
    doc.roundedRect(40, cardTop, 532, 160, 14).stroke();

    const colX = 70;
    const colRightX = 300;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(LABEL);
    doc.text("THE DATE", colX, cardTop + 22);
    doc.font("Helvetica").fontSize(13).fillColor(PAPER);
    doc.text(event.date, colX, cardTop + 36, { width: 180 });

    doc.font("Helvetica-Bold").fontSize(8).fillColor(LABEL);
    doc.text("THE VENUE", colRightX, cardTop + 22);
    doc.font("Helvetica").fontSize(13).fillColor(PAPER);
    doc.text(event.venue, colRightX, cardTop + 36, { width: 240 });

    doc.strokeColor("rgba(255, 255, 255, 0.08)").lineWidth(0.5);
    doc.moveTo(265, cardTop + 20).lineTo(265, cardTop + 140).stroke();

    doc.font("Helvetica-Bold").fontSize(8).fillColor(LABEL);
    doc.text("GUEST", colX, cardTop + 88);
    doc.font("Helvetica").fontSize(13).fillColor(PAPER);
    doc.text(name, colX, cardTop + 102, { width: 180 });

    doc.font("Helvetica-Bold").fontSize(8).fillColor(LABEL);
    doc.text("STATUS", colRightX, cardTop + 88);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#4ade80");
    doc.text("CONFIRMED", colRightX, cardTop + 102);

    const passTop = 445;
    doc.roundedRect(40, passTop, 532, 170, 14).fill(CARD);
    doc.strokeColor(CARD_BORDER).lineWidth(1);
    doc.roundedRect(40, passTop, 532, 170, 14).stroke();

    doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD);
    doc.text("YOUR INVITE CODE", 0, passTop + 26, { width: 612, align: "center" });

    doc.font("Helvetica-Bold").fontSize(24).fillColor(PAPER);
    doc.text(code, 0, passTop + 56, { width: 612, align: "center" });

    doc.strokeColor("rgba(212, 175, 55, 0.25)").lineWidth(0.6);
    doc.moveTo(120, passTop + 104).lineTo(492, passTop + 104).stroke();

    doc.font("Helvetica").fontSize(11).fillColor(MUTED);
    doc.text("Present this code at the door to verify your entry.", 70, passTop + 120, {
      width: 472,
      align: "center",
    });
    doc.text("Keep this pass safe — it is unique to you.", 70, passTop + 140, {
      width: 472,
      align: "center",
    });

    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    doc.text("Crafted by Afara Digital Solutions", 0, 730, {
      width: 612,
      align: "center",
    });

    doc.end();
  });
}
