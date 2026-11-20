import PDFDocument from "pdfkit";
import type { EventConfig } from "@/lib/events";

const GOLD = "#d4af37";
const INK = "#0b0d13";
const PAPER = "#f5efe6";
const MUTED = "rgba(245, 239, 230, 0.5)";
const LABEL = "rgba(168, 155, 128, 0.8)";
const CARD = "#161520";
const CARD_BORDER = "rgba(212, 175, 55, 0.35)";

export function generateRSVPPdf(event: EventConfig, name: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: [612, 792],
      margin: 0,
      info: {
        Title: `RSVP Confirmation — ${event.name}`,
        Author: "Afara Digital Solutions",
      },
    });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ---------- Background ----------
    doc.rect(0, 0, 612, 792).fill(INK);

    // ---------- Top band ----------
    doc.rect(0, 0, 612, 150).fill(CARD);
    doc.fillColor(GOLD);
    doc.rect(0, 150, 612, 5).fill(GOLD);

    // ---------- Header ----------
    doc.font("Helvetica-Bold").fontSize(24).fillColor(PAPER);
    doc.text(event.name, 0, 52, { width: 612, align: "center" });

    doc.font("Helvetica").fontSize(11).fillColor("#a89b80");
    doc.text("REUNITED IN BROTHERHOOD", 0, 86, { width: 612, align: "center" });

    // Thin divider
    doc.strokeColor(GOLD).lineWidth(0.8);
    doc.moveTo(140, 116).lineTo(472, 116).stroke();

    // ---------- Confirmation message ----------
    doc.font("Helvetica-Bold").fontSize(20).fillColor(PAPER);
    doc.text("You're on the list", 0, 155, { width: 612, align: "center" });

    doc.font("Helvetica").fontSize(13).fillColor(MUTED);
    doc.text(`Thank you, ${name}. We can't wait to share the night with you.`, {
      width: 480,
      align: "center",
    });

    // ---------- Event details card ----------
    const cardTop = 260;
    doc.roundedRect(40, cardTop, 532, 170, 14).fill(CARD);
    doc.strokeColor(CARD_BORDER).lineWidth(1);
    doc.roundedRect(40, cardTop, 532, 170, 14).stroke();

    const colX = 70;
    const colRightX = 300;

    // Row 1: Date | Venue
    doc.font("Helvetica-Bold").fontSize(8).fillColor(LABEL);
    doc.text("THE DATE", colX, cardTop + 22);
    doc.font("Helvetica").fontSize(13).fillColor(PAPER);
    doc.text(event.date, colX, cardTop + 36);

    doc.font("Helvetica-Bold").fontSize(8).fillColor(LABEL);
    doc.text("THE VENUE", colRightX, cardTop + 22);
    doc.font("Helvetica").fontSize(13).fillColor(PAPER);
    doc.text(event.venue, colRightX, cardTop + 36);

    // Vertical separator line in card
    doc.strokeColor("rgba(255, 255, 255, 0.08)").lineWidth(0.5);
    doc.moveTo(265, cardTop + 20).lineTo(265, cardTop + 120).stroke();

    // Row 2: Guest | Status
    doc.font("Helvetica-Bold").fontSize(8).fillColor(LABEL);
    doc.text("GUEST", colX, cardTop + 86);
    doc.font("Helvetica").fontSize(13).fillColor(PAPER);
    doc.text(name, colX, cardTop + 100);

    doc.font("Helvetica-Bold").fontSize(8).fillColor(LABEL);
    doc.text("STATUS", colRightX, cardTop + 86);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#4ade80");
    doc.text("CONFIRMED", colRightX, cardTop + 100);

    // ---------- Footer ----------
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    doc.text("Crafted by Afara Digital Solutions", 0, 720, {
      width: 612,
      align: "center",
    });

    doc.end();
  });
}
