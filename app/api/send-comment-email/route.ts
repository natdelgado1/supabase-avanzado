import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/client";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND);

export async function POST(request: NextRequest) {
  try {
    const { postOwnerId, ownerUsername, commenterUsername, commentBody, postCaption } = await request.json();

    if (!postOwnerId) {
      return NextResponse.json({ error: "ID del titular requerido" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin no configurado" }, { status: 500 });
    }

    // Obtener email del titular usando admin client
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(postOwnerId);
          console.info("CODIGO LLEGO ACA");

    if (userError || !userData?.user?.email) {
      console.error("Error obteniendo usuario:", userError);
      return NextResponse.json({ error: "No se pudo obtener email del usuario" }, { status: 400 });
    }

    const ownerEmail = userData.user.email;

    const { data, error } = await resend.emails.send({      
      from: "Suplatzigram <team@nataliadelgado.dev>",
      to: [ownerEmail],
      subject: `💬 ${commenterUsername} comentó en tu post`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">¡Nuevo comentario en tu post!</h2>
          <p>Hola <strong>@${ownerUsername}</strong>,</p>
          <p><strong>@${commenterUsername}</strong> comentó en tu publicación:</p>
          <blockquote style="border-left: 3px solid #8b5cf6; padding-left: 12px; color: #555;">
            "${commentBody}"
          </blockquote>
          <p style="color: #888; font-size: 14px;">Post: "${postCaption?.substring(0, 50) || "Sin caption"}..."</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px;">— Suplatzigram</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error enviando email:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log("Email enviado:", data);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
