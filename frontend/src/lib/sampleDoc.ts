/**
 * Generate a packing-list PNG that MATCHES a given PO (number, supplier, material,
 * quantity, documents), rendered on a canvas. It's uploaded as evidence and read
 * by the SAME on-device OCR pipeline as a real photo — so receiving any PO lines
 * up instead of mismatching the hero's BASF sample. A required "batch certificate"
 * is printed as "not enclosed" so the document exception the PO agent predicted
 * actually materialises at the dock.
 */
export type SamplePO = {
  poNumber: string;
  supplier: string;
  material: string;
  ordered: number;
  unit: string;
  plant: string;
  requiredDocuments: string[];
};

export async function makeSamplePackingList(po: SamplePO): Promise<File> {
  const W = 1240, H = 1600;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) throw new Error("canvas unavailable");

  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#0a2540";
  x.fillRect(0, 0, W, 96);
  x.fillStyle = "#ffffff";
  x.font = "bold 36px Arial";
  x.fillText(po.supplier, 44, 60);
  x.font = "22px Arial";
  x.fillText("PACKING LIST", W - 230, 58);

  x.fillStyle = "#111111";
  let y = 180;
  const line = (s: string, font = "24px Arial", dy = 46) => {
    x.font = font;
    x.fillText(s, 44, y);
    y += dy;
  };

  line(`Purchase Order: ${po.poNumber}`, "bold 28px Arial");
  line(`Plant: ${po.plant}`);
  line(`Supplier: ${po.supplier}`);
  y += 14;
  line("LINE ITEMS", "bold 22px Arial");
  line(`1    ${po.material}`);
  line(`     Quantity: ${po.ordered} ${po.unit}`);
  line(`     Lot: LOT-2026-0617`);
  y += 24;
  line("ENCLOSED DOCUMENTS", "bold 22px Arial");
  const docs = po.requiredDocuments.length ? po.requiredDocuments : ["Packing list"];
  for (const d of docs) {
    const absent = /batch/i.test(d); // the PO-agent-flagged batch cert "follows separately"
    line(absent ? `- ${d} - not enclosed` : `- ${d}`);
  }

  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) throw new Error("could not render packing list");
  return new File([blob], `packing_list_${po.poNumber}.png`, { type: "image/png" });
}
