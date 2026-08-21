import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const defaultPasswordFromEmail = (email: string) => {
  const prefix = email
    .trim()
    .toLowerCase()
    .split("@")[0];

  if (prefix.length >= 6) {
    return prefix;
  }

  const numbers = "123456789";
  const missing = 6 - prefix.length;

  return `${prefix}${numbers.slice(0, missing)}`;
};

serve(async (req) => {
  const requestId = crypto.randomUUID();

  console.log("\n========================================");
  console.log("🟠 ADMIN USERS START");
  console.log("REQUEST ID:", requestId);
  console.log("METHOD:", req.method);
  console.log("TIME:", new Date().toISOString());
  console.log("========================================");

  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] ✅ CORS preflight`);
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.error(
      `[${requestId}] ❌ Método no permitido:`,
      req.method,
    );

    return json(
      {
        ok: false,
        error: "Método no permitido",
        request_id: requestId,
      },
      405,
    );
  }

  try {
    /* =====================================================
       1. SECRETOS
    ====================================================== */

    console.log(`[${requestId}] 1️⃣ Verificando secretos...`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
    const anonKey = Deno.env.get(
      "SUPABASE_ANON_KEY",
    );

    console.log(
      `[${requestId}] SUPABASE_URL:`,
      !!supabaseUrl,
    );
    console.log(
      `[${requestId}] SERVICE_ROLE_KEY:`,
      !!serviceRoleKey,
    );
    console.log(
      `[${requestId}] ANON_KEY:`,
      !!anonKey,
    );

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !anonKey
    ) {
      console.error(
        `[${requestId}] ❌ Faltan secretos de Supabase`,
      );

      return json(
        {
          ok: false,
          error:
            "Faltan secretos de Supabase en la Edge Function",
          request_id: requestId,
        },
        500,
      );
    }

    /* =====================================================
       2. AUTH HEADER
    ====================================================== */

    console.log(
      `[${requestId}] 2️⃣ Validando Authorization...`,
    );

    const authHeader =
      req.headers.get("Authorization") || "";

    console.log(
      `[${requestId}] Bearer presente:`,
      authHeader.startsWith("Bearer "),
    );

    if (!authHeader.startsWith("Bearer ")) {
      console.error(
        `[${requestId}] ❌ No llegó Bearer token`,
      );

      return json(
        {
          ok: false,
          error: "No autenticado",
          request_id: requestId,
        },
        401,
      );
    }

    /* =====================================================
       3. CLIENTES SUPABASE
    ====================================================== */

    console.log(
      `[${requestId}] 3️⃣ Creando clientes Supabase...`,
    );

    const callerClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          persistSession: false,
        },
      },
    );

    const service = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    /* =====================================================
       4. USUARIO QUE LLAMA
    ====================================================== */

    console.log(
      `[${requestId}] 4️⃣ Validando usuario autenticado...`,
    );

    const {
      data: callerData,
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError) {
      console.error(
        `[${requestId}] ❌ CALLER AUTH ERROR:`,
        callerError,
      );
    }

    if (!callerData.user) {
      console.error(
        `[${requestId}] ❌ Sesión inválida`,
      );

      return json(
        {
          ok: false,
          error: "Sesión inválida",
          request_id: requestId,
        },
        401,
      );
    }

    console.log(
      `[${requestId}] ✅ Usuario autenticado`,
    );
    console.log(
      `[${requestId}] CALLER USER ID:`,
      callerData.user.id,
    );
    console.log(
      `[${requestId}] CALLER EMAIL:`,
      callerData.user.email,
    );

    /* =====================================================
       5. PERFIL DEL ADMIN
    ====================================================== */

    console.log(
      `[${requestId}] 5️⃣ Consultando profile del caller...`,
    );

    const {
      data: callerProfile,
      error: callerProfileError,
    } = await service
      .from("profiles")
      .select("role,is_active")
      .eq(
        "id",
        callerData.user.id,
      )
      .maybeSingle();

    if (callerProfileError) {
      console.error(
        `[${requestId}] ❌ CALLER PROFILE ERROR:`,
        callerProfileError,
      );

      throw callerProfileError;
    }

    console.log(
      `[${requestId}] CALLER PROFILE:`,
      callerProfile,
    );

    if (
      callerProfile?.role !== "admin" ||
      callerProfile?.is_active === false
    ) {
      console.error(
        `[${requestId}] ❌ Sin permisos admin`,
        callerProfile,
      );

      return json(
        {
          ok: false,
          error:
            "No tienes permisos de administrador",
          request_id: requestId,
        },
        403,
      );
    }

    /* =====================================================
       6. BODY
    ====================================================== */

    console.log(
      `[${requestId}] 6️⃣ Leyendo body...`,
    );

    const body = await req.json();

    const action = String(
      body?.action || "",
    );

    console.log(
      `[${requestId}] ACTION:`,
      action,
    );

    console.log(
      `[${requestId}] BODY SAFE:`,
      {
        action,
        email: body?.email,
        full_name: body?.full_name,
        phone: body?.phone,
        role: body?.role,
        user_id: body?.user_id,
        is_active: body?.is_active,
        has_password:
          Boolean(body?.password),
      },
    );

    /* =====================================================
       ACTION: LIST
    ====================================================== */

    if (action === "list") {
      console.log(
        `[${requestId}] 📋 LIST USERS START`,
      );

      const {
        data: usersData,
        error: usersError,
      } =
        await service.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (usersError) {
        console.error(
          `[${requestId}] ❌ LIST USERS AUTH ERROR:`,
          usersError,
        );

        throw usersError;
      }

      console.log(
        `[${requestId}] AUTH USERS FOUND:`,
        usersData.users.length,
      );

      const ids =
        usersData.users.map(
          (u) => u.id,
        );

      console.log(
        `[${requestId}] Consultando profiles...`,
      );

      const {
        data: profiles,
        error: profilesError,
      } = ids.length
        ? await service
            .from("profiles")
            .select(
              "id,full_name,email,phone,role,is_active,created_at,updated_at",
            )
            .in("id", ids)
        : {
            data: [],
            error: null,
          } as any;

      if (profilesError) {
        console.error(
          `[${requestId}] ❌ PROFILES LIST ERROR:`,
          profilesError,
        );

        throw profilesError;
      }

      console.log(
        `[${requestId}] PROFILES FOUND:`,
        profiles?.length || 0,
      );

      const profileMap =
        new Map(
          (profiles || []).map(
            (p: any) => [
              p.id,
              p,
            ],
          ),
        );

      const users =
        usersData.users.map(
          (u) => {
            const p: any =
              profileMap.get(
                u.id,
              ) || {};

            const active =
              p.is_active !== false &&
              !u.banned_until;

            return {
              id: u.id,
              email:
                p.email ||
                u.email ||
                "",
              full_name:
                p.full_name ||
                u.user_metadata
                  ?.full_name ||
                "",
              phone:
                p.phone ||
                u.user_metadata
                  ?.phone ||
                "",
              role:
  p.role === "admin"
    ? "admin"
    : "user",
              is_active:
                active,
              created_at:
                p.created_at ||
                u.created_at,
              last_sign_in_at:
                u.last_sign_in_at ||
                null,
            };
          },
        );

      console.log(
        `[${requestId}] ✅ LIST USERS SUCCESS`,
      );

      console.log(
        `[${requestId}] USERS RETURNED:`,
        users.length,
      );

      return json({
        ok: true,
        users,
        request_id: requestId,
      });
    }

    /* =====================================================
       ACTION: CREATE
    ====================================================== */

    if (action === "create") {
      console.log(
        `[${requestId}] 👤 CREATE USER START`,
      );

      const email = String(
        body?.email || "",
      )
        .trim()
        .toLowerCase();

      const fullName = String(
        body?.full_name || "",
      ).trim();

      const phone = String(
        body?.phone || "",
      ).trim();

      const role =
  body?.role === "admin"
    ? "admin"
    : "user";

      const requestedPassword =
        String(
          body?.password || "",
        ).trim();

      const password =
        requestedPassword ||
        defaultPasswordFromEmail(
          email,
        );

      console.log(
        `[${requestId}] CREATE DATA:`,
        {
          email,
          fullName,
          phone,
          role,
          password_source:
            requestedPassword
              ? "manual"
              : "generated",
          password_length:
            password.length,
        },
      );

      if (
        !email ||
        !/^\S+@\S+\.\S+$/.test(
          email,
        )
      ) {
        console.error(
          `[${requestId}] ❌ Correo inválido:`,
          email,
        );

        return json(
          {
            ok: false,
            error:
              "Ingresa un correo válido",
            request_id:
              requestId,
          },
          400,
        );
      }

      if (!fullName) {
        console.error(
          `[${requestId}] ❌ Nombre vacío`,
        );

        return json(
          {
            ok: false,
            error:
              "Ingresa el nombre del usuario",
            request_id:
              requestId,
          },
          400,
        );
      }

      if (
        password.length < 6
      ) {
        console.error(
          `[${requestId}] ❌ Password demasiado corto`,
          {
            length:
              password.length,
          },
        );

        return json(
          {
            ok: false,
            error:
              "La contraseña generada tiene menos de 6 caracteres; ingresa una contraseña manual",
            request_id:
              requestId,
          },
          400,
        );
      }

      console.log(
        `[${requestId}] Creando usuario en Supabase Auth...`,
      );

      const {
        data: created,
        error: createError,
      } =
        await service.auth.admin.createUser(
          {
            email,
            password,
            email_confirm:
              true,
            user_metadata: {
              full_name:
                fullName,
              phone,
              role,
            },
          },
        );

      if (createError) {
        console.error(
          `[${requestId}] ❌ CREATE AUTH USER ERROR:`,
          createError,
        );

        console.error(
          `[${requestId}] CREATE AUTH ERROR MESSAGE:`,
          createError.message,
        );

        console.error(
          `[${requestId}] CREATE AUTH ERROR STATUS:`,
          createError.status,
        );

        const msg =
          createError.message
            .toLowerCase();

        if (
          msg.includes(
            "already",
          ) ||
          msg.includes(
            "registered",
          )
        ) {
          return json(
            {
              ok: false,
              error:
                "Ya existe una cuenta con ese correo",
              request_id:
                requestId,
            },
            409,
          );
        }

        throw createError;
      }

      console.log(
        `[${requestId}] ✅ AUTH USER CREATED`,
      );

      console.log(
        `[${requestId}] CREATED USER ID:`,
        created.user.id,
      );

      const userId =
        created.user.id;

      console.log(
        `[${requestId}] Guardando profile...`,
      );

      const {
        error:
          profileError,
      } = await service
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name:
              fullName,
            email,
            phone:
              phone ||
              null,
            role,
            is_active:
              true,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "id",
          },
        );

      if (profileError) {
        console.error(
          `[${requestId}] ❌ PROFILE UPSERT ERROR:`,
          profileError,
        );

        console.error(
          `[${requestId}] Eliminando usuario Auth por rollback...`,
        );

        try {
          await service.auth.admin.deleteUser(
            userId,
          );

          console.log(
            `[${requestId}] ✅ Rollback Auth realizado`,
          );
        } catch (
          rollbackError
        ) {
          console.error(
            `[${requestId}] ❌ ROLLBACK ERROR:`,
            rollbackError,
          );
        }

        throw profileError;
      }

      console.log(
        `[${requestId}] ✅ PROFILE CREATED`,
      );

      console.log(
        `[${requestId}] 🟢 CREATE USER SUCCESS`,
      );

      return json({
        ok: true,

        user: {
          id: userId,
          email,
          full_name:
            fullName,
          phone,
          role,
          is_active:
            true,
        },

        temporary_password:
          password,

        request_id:
          requestId,
      });
    }

    /* =====================================================
       ACTION: SET ACTIVE
    ====================================================== */

    if (
      action ===
      "set_active"
    ) {
      console.log(
        `[${requestId}] 🔄 SET ACTIVE START`,
      );

      const userId =
        String(
          body?.user_id ||
            "",
        );

      const active =
        Boolean(
          body?.is_active,
        );

      console.log(
        `[${requestId}] TARGET USER ID:`,
        userId,
      );

      console.log(
        `[${requestId}] NEW ACTIVE STATE:`,
        active,
      );

      if (!userId) {
        console.error(
          `[${requestId}] ❌ user_id vacío`,
        );

        return json(
          {
            ok: false,
            error:
              "Usuario inválido",
            request_id:
              requestId,
          },
          400,
        );
      }

      if (
        userId ===
          callerData.user
            .id &&
        !active
      ) {
        console.error(
          `[${requestId}] ❌ Intento de desactivar propia cuenta`,
        );

        return json(
          {
            ok: false,
            error:
              "No puedes dar de baja tu propia cuenta administradora",
            request_id:
              requestId,
          },
          400,
        );
      }

      console.log(
        `[${requestId}] Actualizando Auth ban_duration...`,
      );

      const {
        error:
          authUpdateError,
      } =
        await service.auth.admin.updateUserById(
          userId,
          {
            ban_duration:
              active
                ? "none"
                : "876000h",
          },
        );

      if (
        authUpdateError
      ) {
        console.error(
          `[${requestId}] ❌ AUTH UPDATE ERROR:`,
          authUpdateError,
        );

        console.error(
          `[${requestId}] AUTH UPDATE MESSAGE:`,
          authUpdateError.message,
        );

        throw authUpdateError;
      }

      console.log(
        `[${requestId}] ✅ Auth actualizado`,
      );

      console.log(
        `[${requestId}] Actualizando profile...`,
      );

      const {
        error:
          profileUpdateError,
      } = await service
        .from("profiles")
        .update({
          is_active:
            active,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          userId,
        );

      if (
        profileUpdateError
      ) {
        console.error(
          `[${requestId}] ❌ PROFILE UPDATE ERROR:`,
          profileUpdateError,
        );

        throw profileUpdateError;
      }

      console.log(
        `[${requestId}] ✅ Profile actualizado`,
      );

      console.log(
        `[${requestId}] 🟢 SET ACTIVE SUCCESS`,
      );

      return json({
        ok: true,
        request_id:
          requestId,
      });
    }

    /* =====================================================
       ACTION DESCONOCIDA
    ====================================================== */

    console.error(
      `[${requestId}] ❌ Acción no reconocida:`,
      action,
    );

    return json(
      {
        ok: false,
        error:
          "Acción no reconocida",
        action,
        request_id:
          requestId,
      },
      400,
    );
  } catch (error) {
    console.error(
      "\n========================================",
    );

    console.error(
      `[${requestId}] 💥 ADMIN USERS FATAL ERROR`,
    );

    console.error(
      `[${requestId}] ERROR RAW:`,
      error,
    );

    if (
      error instanceof Error
    ) {
      console.error(
        `[${requestId}] ERROR NAME:`,
        error.name,
      );

      console.error(
        `[${requestId}] ERROR MESSAGE:`,
        error.message,
      );

      console.error(
        `[${requestId}] ERROR STACK:`,
        error.stack,
      );
    }

    console.error(
      "========================================\n",
    );

    return json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),

        request_id:
          requestId,
      },
      500,
    );
  }
});