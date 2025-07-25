import type { Coupon } from "@prisma/client";

import { sendMail } from "@/lib/brevo";
import { db } from "@/lib/db";

/**
 * Sends a promotional email for a specific coupon to a user.
 *
 * @param {string} to - The recipient's email address.
 * @param {Coupon} coupon - The coupon object from the database.
 * @param {string} subject - The subject of the email.
 * @param {string} [message] - An optional custom message to include.
 * @returns {Promise<void>}
 */
export async function sendCouponEmail({
  to,
  coupon,
  subject,
  message,
}: {
  to: string;
  coupon: Coupon;
  subject: string;
  message?: string;
}): Promise<void> {
  const storeSettings = await db.storeSettings.findFirst();
  const storeName = storeSettings?.storeName || "TechTots";

  // Create email content
  const discountText =
    coupon.type === "PERCENTAGE"
      ? `${coupon.value}% REDUCERE`
      : `${coupon.value} LEI REDUCERE`;

  const expiryText = coupon.expiresAt
    ? `Expiră: ${coupon.expiresAt.toLocaleDateString("ro-RO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`
    : "Fără dată de expirare";

  const minOrderText = coupon.minimumOrderValue
    ? `Valoare minimă comandă: ${coupon.minimumOrderValue} LEI`
    : "";

  const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${storeName}</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Jucării STEM pentru minți curioase</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 15px; text-align: center; margin-bottom: 25px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 15px 0; font-size: 26px; font-weight: 700;">🎉 Ofertă Specială Pentru Tine!</h2>
          <div style="font-size: 42px; font-weight: 900; margin: 25px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${discountText}</div>
          <div style="font-size: 18px; margin: 15px 0; background: rgba(255,255,255,0.15); padding: 12px 20px; border-radius: 25px; display: inline-block;">
            Utilizează codul: <strong style="background: rgba(255,255,255,0.25); padding: 8px 16px; border-radius: 8px; font-size: 22px; letter-spacing: 2px; font-family: 'Courier New', monospace;">${coupon.code}</strong>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 5px solid #3b82f6;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px; display: flex; align-items: center;">
            <span style="margin-right: 10px;">🎁</span> ${coupon.name}
          </h3>
          ${coupon.description ? `<p style="color: #6b7280; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">${coupon.description}</p>` : ""}
          ${message ? `<div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0288d1;"><p style="color: #01579b; margin: 0; font-style: italic;">"${message}"</p></div>` : ""}
          
          <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <div style="display: grid; gap: 12px;">
              <p style="margin: 0; color: #374151; font-size: 15px; display: flex; align-items: center;">
                <span style="margin-right: 8px; font-size: 18px;">📅</span>
                <strong>${expiryText}</strong>
              </p>
              ${minOrderText ? `<p style="margin: 0; color: #374151; font-size: 15px; display: flex; align-items: center;"><span style="margin-right: 8px; font-size: 18px;">💰</span><strong>${minOrderText}</strong></p>` : ""}
              ${coupon.maxUsesPerUser ? `<p style="margin: 0; color: #374151; font-size: 15px; display: flex; align-items: center;"><span style="margin-right: 8px; font-size: 18px;">👤</span><strong>Limită: ${coupon.maxUsesPerUser} utilizare/utilizări per client</strong></p>` : ""}
              ${coupon.type === "PERCENTAGE" && coupon.maxDiscountAmount ? `<p style="margin: 0; color: #374151; font-size: 15px; display: flex; align-items: center;"><span style="margin-right: 8px; font-size: 18px;">🎯</span><strong>Reducere maximă: ${coupon.maxDiscountAmount} LEI</strong></p>` : ""}
            </div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
          <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">🚀 Cum să folosești codul:</h3>
          <div style="color: rgba(255,255,255,0.95); font-size: 14px; line-height: 1.8;">
            <p style="margin: 8px 0;">1️⃣ Adaugă produsele dorite în coș</p>
            <p style="margin: 8px 0;">2️⃣ Introdu codul <strong>${coupon.code}</strong> la finalizarea comenzii</p>
            <p style="margin: 8px 0;">3️⃣ Bucură-te de reducerea ta!</p>
          </div>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${storeSettings?.storeUrl || "https://techtots.com"}"
             style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); transform: translateY(0); transition: all 0.3s ease;">
            🛒 Cumpără Acum & Economisește
          </a>
        </div>

        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
          <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚡ Ofertă pe Timp Limitat!</h4>
          <p style="color: #a16207; margin: 0; font-size: 14px;">
            Grăbește-te! Această ofertă este valabilă doar pentru o perioadă limitată și în limita stocului disponibil.
          </p>
        </div>

        <div style="text-align: center; padding: 25px; border-top: 2px solid #e5e7eb; margin-top: 40px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">🌟 De ce să alegi ${storeName}?</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 5px;">🎓</div>
              <div style="font-size: 12px; color: #0369a1; font-weight: 600;">Educație STEM</div>
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 5px;">🚚</div>
              <div style="font-size: 12px; color: #15803d; font-weight: 600;">Livrare Rapidă</div>
            </div>
            <div style="background: #fef7ff; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 5px;">💎</div>
              <div style="font-size: 12px; color: #9333ea; font-weight: 600;">Calitate Premium</div>
            </div>
            <div style="background: #fff7ed; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 5px;">🎯</div>
              <div style="font-size: 12px; color: #ea580c; font-weight: 600;">Dezvoltare Copii</div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 16px; color: #374151; margin: 0;">Cu respect și prețuire,</p>
          <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 5px 0 0 0;">Echipa ${storeName}</p>
          <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0; font-style: italic;">Investim în viitorul copiilor prin educația STEM</p>
        </div>

        <div style="text-align: center; padding: 25px; border-top: 1px solid #e5e7eb; margin-top: 40px; background: #f9fafb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
            Ai primit acest email deoarece ești abonat la actualizările ${storeName}.<br>
            Dacă nu mai dorești să primești aceste emailuri, poți să te 
            <a href="${storeSettings?.storeUrl || "https://techtots.com"}/unsubscribe" style="color: #6b7280; text-decoration: underline;">dezabonezi aici</a>.
          </p>
          <div style="margin-top: 15px;">
            <a href="${storeSettings?.storeUrl || "https://techtots.com"}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">🏠 Acasă</a>
            <a href="${storeSettings?.storeUrl || "https://techtots.com"}/contact" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">📞 Contact</a>
            <a href="${storeSettings?.storeUrl || "https://techtots.com"}/privacy" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">🔒 Confidențialitate</a>
          </div>
        </div>
      </div>
    `;

  await sendMail({
    to,
    subject,
    html: emailHtml,
    from: storeSettings?.contactEmail,
    fromName: storeName,
  });
}
