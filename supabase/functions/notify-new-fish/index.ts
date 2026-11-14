// つりずかん: ユーザーが魚種を登録したら管理者にメールで知らせる Edge Function
//
// 呼び出し元: Supabase Database Webhook（public.fish の INSERT）
// 必要な secrets（supabase secrets set ...）:
//   RESEND_API_KEY   … Resend の API キー
//   NOTIFY_EMAIL     … 通知先メールアドレス（Resend アカウントのメールアドレスと同じにする）
//   WEBHOOK_SECRET   … Database Webhook の HTTP Header "x-webhook-secret" に入れる任意の文字列
// 任意:
//   NOTIFY_FROM      … 送信元（未設定なら "つりずかん <onboarding@resend.dev>"）
//   APP_URL          … メール内リンク先（未設定なら https://knak-lab.github.io/tsurizukan/）
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Edge Function に自動で入る。

const ENV_LABEL: Record<string, string> = { salt: "海水", brackish: "汽水", fresh: "淡水" }
const TAX_LABEL: Record<string, string> = { fish: "魚類", cephalo: "頭足類", crust: "甲殻類" }

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

async function fetchNickname(userId: string | null): Promise<string> {
  if (!userId) return "不明"
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) return userId
  try {
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}&select=nickname`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    const rows = await res.json()
    return rows?.[0]?.nickname ?? userId
  } catch {
    return userId
  }
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("WEBHOOK_SECRET")
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return new Response("unauthorized", { status: 401 })
  }

  const payload = await req.json().catch(() => null)
  const fish = payload?.record
  // 管理者が自分で追加した魚種（needs_review=false）は通知しない
  if (payload?.type !== "INSERT" || payload?.table !== "fish" || !fish?.needs_review) {
    return new Response(JSON.stringify({ skipped: true }), { headers: { "Content-Type": "application/json" } })
  }

  const apiKey = Deno.env.get("RESEND_API_KEY")
  const to = Deno.env.get("NOTIFY_EMAIL")
  if (!apiKey || !to) {
    return new Response("RESEND_API_KEY / NOTIFY_EMAIL が未設定です", { status: 500 })
  }
  const from = Deno.env.get("NOTIFY_FROM") ?? "つりずかん <onboarding@resend.dev>"
  const appUrl = Deno.env.get("APP_URL") ?? "https://knak-lab.github.io/tsurizukan/"

  const nickname = await fetchNickname(fish.created_by)
  const rows: [string, unknown][] = [
    ["ID", fish.id],
    ["和名", fish.name],
    ["英名", fish.en || "（未入力）"],
    ["生息環境", ENV_LABEL[fish.env] ?? fish.env],
    ["分類", TAX_LABEL[fish.tax] ?? fish.tax],
    ["サイズ帯", fish.size_min == null ? "（未入力・要設定）" : `${fish.size_min}〜${fish.size_max} cm`],
    ["メモ", fish.tokuchou || "（なし）"],
    ["登録者", nickname],
    ["登録日時", fish.created_at],
  ]
  const html = `
    <p>ユーザーが新しい魚種を図鑑に登録しました。画像などの整備をお願いします。</p>
    <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><th align="left" style="border-bottom:1px solid #ddd">${escapeHtml(k)}</th><td style="border-bottom:1px solid #ddd">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
    <p><a href="${escapeHtml(appUrl)}">つりずかんを開く</a> → 管理 → 魚種の管理（「要整備」のみ表示）</p>
  `
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${appUrl}`

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `【つりずかん】新しい魚種「${fish.name}」が登録されました`,
      html,
      text,
    }),
  })
  const body = await res.text()
  if (!res.ok) {
    console.error("Resend error", res.status, body)
    return new Response(body, { status: 502 })
  }
  return new Response(body, { headers: { "Content-Type": "application/json" } })
})
