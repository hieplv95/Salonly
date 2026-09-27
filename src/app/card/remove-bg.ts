// Phía trình duyệt: gửi ảnh cho AI thay nền bằng xanh lá, rồi đổi màu xanh thành trong suốt.

async function toJpeg(src: string, maxSide = 1536) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * k);
  canvas.height = Math.round(img.naturalHeight * k);
  const ctx = canvas.getContext("2d")!;
  // Ảnh có nền trong suốt: lót trắng để AI thấy rõ chủ thể.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

// Tách nền xanh lá: điểm càng "xanh trội" càng trong suốt; viền chuyển mềm và bớt ám xanh.
async function keyOutGreen(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const spill = g - Math.max(r, b); // độ "xanh trội"
    if (spill > 90) px[i + 3] = 0;
    else if (spill > 35) {
      px[i + 3] = Math.round(255 * (1 - (spill - 35) / 55));
      px[i + 1] = Math.max(r, b); // bớt ám xanh ở viền
    } else if (spill > 10) px[i + 1] = Math.round(g - spill * 0.6);
  }
  ctx.putImageData(data, 0, 0);
  return { url: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

export async function removeImageBackground(src: string) {
  const res = await fetch("/api/remove-bg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: await toJpeg(src) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Chưa xoá được nền ảnh.");
  return keyOutGreen(data.image);
}
