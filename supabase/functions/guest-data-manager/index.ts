import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GuestVerificationRequest {
  action: 'generate_token' | 'verify_deletion' | 'request_deletion';
  sessionPseudonym: string;
  email: string;
  fullName: string;
  verificationToken?: string;
  deviceInfo?: string;
  userAgent?: string;
}

interface DeletionRequestPayload {
  sessionPseudonym: string;
  email?: string;
  verificationToken?: string;
  fullName?: string;
  additionalInfo?: any;
  requestType: 'guest_token' | 'manual_verification' | 'user_account';
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (req.method === 'POST') {
      if (pathname === '/generate-verification-token') {
        return await handleGenerateVerificationToken(req);
      } else if (pathname === '/request-data-deletion') {
        return await handleDataDeletionRequest(req);
      } else if (pathname === '/verify-deletion-token') {
        return await handleVerifyDeletionToken(req);
      }
    } else if (req.method === 'GET') {
      if (pathname === '/deletion-status') {
        return await handleGetDeletionStatus(req);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in guest-data-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGenerateVerificationToken(req: Request): Promise<Response> {
  const { sessionPseudonym, email, fullName, deviceInfo, userAgent }: GuestVerificationRequest = await req.json();

  // Generate unique verification token
  const verificationToken = crypto.randomUUID();
  
  // Get client IP
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

  // Store verification token
  const { error: insertError } = await supabase
    .from('guest_verification_tokens')
    .insert({
      session_pseudonym: sessionPseudonym,
      email,
      verification_token: verificationToken,
      full_name: fullName,
      device_info: deviceInfo,
      ip_address: clientIP,
      user_agent: userAgent
    });

  if (insertError) {
    console.error('Error inserting verification token:', insertError);
    throw new Error('Failed to generate verification token');
  }

  // Send verification email
  try {
    const { error: emailError } = await resend.emails.send({
      from: 'Adagio GDPR <privacy@adagio.com>',
      to: [email],
      subject: '🔐 Tu Token de Verificación GDPR - Adagio',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Token de Verificación</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Para gestión de tus datos personales</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">Hola <strong>${fullName}</strong>,</p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Has solicitado un token de verificación para poder gestionar tus datos personales en Adagio. 
              Este token te permitirá solicitar la eliminación de tus grabaciones de voz cuando lo desees.
            </p>

            <div style="background: white; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Tu Token de Verificación</p>
              <p style="color: #333; font-size: 24px; font-weight: bold; font-family: monospace; margin: 0; word-break: break-all; background: #f8f9fa; padding: 15px; border-radius: 6px;">
                ${verificationToken}
              </p>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Importante:</strong> Guarda este token en un lugar seguro. Lo necesitarás para solicitar la eliminación de tus datos.
              </p>
            </div>

            <h3 style="color: #333; margin: 25px 0 15px 0;">📋 Detalles de tu solicitud:</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li><strong>Nombre:</strong> ${fullName}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</li>
              <li><strong>Token válido hasta:</strong> 30 días</li>
            </ul>

            <h3 style="color: #333; margin: 25px 0 15px 0;">🗑️ Para eliminar tus datos:</h3>
            <p style="color: #666; line-height: 1.6;">
              Visita nuestro <a href="${Deno.env.get('SUPABASE_URL') || 'https://tu-app.com'}/privacy-center" style="color: #667eea; text-decoration: none;">Centro de Privacidad</a> 
              e introduce tu token de verificación para solicitar la eliminación de tus datos.
            </p>

            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #0c5460; margin: 0; font-size: 14px;">
                <strong>🛡️ Tu privacidad es importante:</strong> Este token expira en 30 días por seguridad. 
                Si necesitas un nuevo token después de la expiración, puedes solicitarlo nuevamente.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              Si no solicitaste este token, puedes ignorar este mensaje de forma segura.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Atentamente,<br>
              <strong>El equipo de Adagio</strong>
            </p>
          </div>
        </div>
      `
    });

    if (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail the request if email fails, token is still generated
    }
  } catch (emailError) {
    console.error('Email service error:', emailError);
    // Continue even if email fails
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Token de verificación generado y enviado por email',
      verificationToken // Include in response for testing purposes
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDataDeletionRequest(req: Request): Promise<Response> {
  const payload: DeletionRequestPayload = await req.json();

  // Validate verification token if provided
  if (payload.verificationToken) {
    const { data: tokenData, error: tokenError } = await supabase
      .from('guest_verification_tokens')
      .select('*')
      .eq('verification_token', payload.verificationToken)
      .eq('session_pseudonym', payload.sessionPseudonym)
      .single();

    if (tokenError || !tokenData || tokenData.used_for_deletion) {
      return new Response(
        JSON.stringify({ error: 'Token de verificación inválido o ya utilizado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Token de verificación expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Create deletion request
  const { data: deletionRequest, error: deletionError } = await supabase
    .from('data_deletion_requests')
    .insert({
      session_pseudonym: payload.sessionPseudonym,
      request_type: payload.requestType,
      email: payload.email,
      verification_token: payload.verificationToken,
      full_name: payload.fullName,
      additional_info: payload.additionalInfo
    })
    .select()
    .single();

  if (deletionError) {
    console.error('Error creating deletion request:', deletionError);
    throw new Error('Failed to create deletion request');
  }

  // Mark token as used if provided
  if (payload.verificationToken) {
    await supabase
      .from('guest_verification_tokens')
      .update({ 
        used_for_deletion: true,
        deletion_requested_at: new Date().toISOString()
      })
      .eq('verification_token', payload.verificationToken);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      requestId: deletionRequest.id,
      message: 'Solicitud de eliminación creada exitosamente'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleVerifyDeletionToken(req: Request): Promise<Response> {
  const { verificationToken } = await req.json();

  const { data: tokenData, error } = await supabase
    .from('guest_verification_tokens')
    .select('*')
    .eq('verification_token', verificationToken)
    .single();

  if (error || !tokenData) {
    return new Response(
      JSON.stringify({ valid: false, error: 'Token no encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const isExpired = new Date(tokenData.expires_at) < new Date();
  const isUsed = tokenData.used_for_deletion;

  return new Response(
    JSON.stringify({ 
      valid: !isExpired && !isUsed,
      expired: isExpired,
      used: isUsed,
      tokenData: {
        fullName: tokenData.full_name,
        email: tokenData.email,
        createdAt: tokenData.created_at,
        expiresAt: tokenData.expires_at
      }
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetDeletionStatus(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const requestId = url.searchParams.get('requestId');
  const verificationToken = url.searchParams.get('verificationToken');

  if (!requestId && !verificationToken) {
    return new Response(
      JSON.stringify({ error: 'Se requiere requestId o verificationToken' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let query = supabase.from('data_deletion_requests').select('*');
  
  if (requestId) {
    query = query.eq('id', requestId);
  } else if (verificationToken) {
    query = query.eq('verification_token', verificationToken);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: 'Solicitud no encontrada' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}