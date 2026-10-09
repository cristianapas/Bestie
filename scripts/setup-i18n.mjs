#!/usr/bin/env node
/**
 * Automated script to port cinny-i18n into Prinny / prinny-client.
 *
 * Usage:
 *   node scripts/setup-i18n.mjs
 *   node scripts/setup-i18n.mjs --target path/to/frontend
 *
 * Fully idempotent: safe to run multiple times without corrupting syntax.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const NAMESPACES = ['components', 'features', 'hooks', 'pages', 'util'];
const I18N_REPO = 'https://github.com/Kx501/cinny-i18n.git';

function resolveFrontendDir() {
  const args = process.argv.slice(2);
  const targetIdx = args.indexOf('--target');
  if (targetIdx !== -1 && args[targetIdx + 1]) {
    const customPath = path.resolve(args[targetIdx + 1]);
    if (fs.existsSync(path.join(customPath, 'src', 'app'))) return customPath;
    if (fs.existsSync(path.join(customPath, 'cinny', 'src', 'app'))) return path.join(customPath, 'cinny');
  }

  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'cinny', 'src', 'app'))) return path.join(cwd, 'cinny');
  if (fs.existsSync(path.join(cwd, 'src', 'app'))) return cwd;

  throw new Error('No se encontró el directorio del frontend (prinny o cinny).');
}

function runGit(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' }).trim();
  } catch (err) {
    return null;
  }
}

// 1. Sincronizar locales de cinny-i18n
function syncLocalesViaGit(frontendDir) {
  console.log('⬇️  Sincronizando locales desde Kx501/cinny-i18n vía Git...');
  const remotes = runGit('git remote', frontendDir) || '';
  if (!remotes.split('\n').includes('i18n')) {
    runGit(`git remote add i18n ${I18N_REPO}`, frontendDir);
  }

  runGit('git fetch i18n master', frontendDir);
  try {
    execSync(`git archive i18n/master public/locales | tar -x -C "${frontendDir}"`, {
      cwd: frontendDir,
      stdio: 'pipe',
    });
  } catch {
    runGit('git checkout i18n/master -- public/locales', frontendDir);
  }

  const localesDir = path.join(frontendDir, 'public', 'locales');
  for (const oldFile of ['en.json', 'de.json']) {
    const oldPath = path.join(localesDir, oldFile);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  console.log('   [ok] Locales base obtenidos con éxito.');
}

// 2. Generar traducción en Español (es-ES)
function createSpanishLocales(frontendDir) {
  console.log('🇪🇸 Generando archivos de localización en Español (es-ES)...');
  const esDir = path.join(frontendDir, 'public', 'locales', 'es-ES');
  fs.mkdirSync(esDir, { recursive: true });

  const enDir = path.join(frontendDir, 'public', 'locales', 'en-US');

  const SPANISH_DICT = {
    cancel: 'Cancelar', close: 'Cerrar', continue: 'Continuar', copy: 'Copiar',
    edit: 'Editar', editor: 'Editor', save: 'Guardar', verify: 'Verificar',
    logout: 'Cerrar sesión', connected: 'Conectado', disconnected: 'Desconectado',
    syncing: 'Sincronizando', download: 'Descargar', version: 'Versión',
    developer_tools: 'Herramientas de desarrollo', public: 'Público',
    invite_only: 'Solo por invitación', okay: 'Aceptar', reset: 'Restablecer',
    all_messages: 'Todos los mensajes', mention_keywords: 'Menciones y palabras clave',
    mute: 'Silenciar', default: 'Predeterminado', answer: 'Responder', reject: 'Rechazar',
    accept: 'Aceptar', ignore: 'Ignorar', remove: 'Eliminar', show: 'Mostrar',
    hide: 'Ocultar', retry: 'Reintentar',

    settings: 'Configuración', _general: 'General', _account: 'Cuenta',
    _notifications: 'Notificaciones', _devices: 'Dispositivos',
    emojis_stickers: 'Emojis y Stickers', _about: 'Acerca de',
    keybinds: 'Atajos de teclado',

    general: 'General', language: 'Idioma',
    choose_your_preferred: 'Elige tu idioma de visualización preferido.',
    appearance: 'Apariencia', system_theme: 'Tema del sistema',
    choose_between_light: 'Elegir entre tema claro y oscuro según la preferencia del sistema.',
    theme: 'Tema', theme_to_use: 'Tema a utilizar cuando el tema del sistema no está habilitado.',
    monochrome_mode: 'Modo monocromático',
    date_time: 'Fecha y hora', date_format: 'Formato de fecha',
    '24_hour_time_format': 'Formato de 24 horas',
    messages: 'Mensajes', message_layout: 'Diseño de mensajes',
    message_spacing: 'Espaciado de mensajes', legacy_username_color: 'Color de usuario clásico',
    hide_membership_change: 'Ocultar cambios de miembros',
    hide_profile_change: 'Ocultar cambios de perfil',
    disable_media_auto: 'Desactivar carga automática de multimedia',
    url_preview: 'Vista previa de enlaces', url_preview_in_encrypted_room: 'Vista previa en salas cifradas',
    show_hidden_events: 'Mostrar eventos ocultos',
    enter_for_newline: 'ENTER para nueva línea', markdown_formatting: 'Formato Markdown',
    hide_typing_read_receipts: 'Ocultar escritura y confirmaciones de lectura',
    turn_off_both: 'Desactiva el estado de escritura y confirmaciones de lectura para mantener tu privacidad.',
    notifications: 'Notificaciones', system_notification: 'Notificaciones del sistema',
    account: 'Cuenta', devices: 'Dispositivos', about: 'Acerca de',

    home: 'Inicio', explore_community: 'Explorar comunidad',
    mark_as_read: 'Marcar como leído', direct_messages: 'Mensajes directos',
    inbox: 'Bandeja de entrada', user_settings: 'Ajustes de usuario',
    add_space: 'Añadir espacio', create_space: 'Crear espacio',
    build_a_space_for_your_community: 'Crea un espacio para tu comunidad.',
    join_with_address: 'Unirse con dirección',
    become_a_part_of_existing_community: 'Forma parte de una comunidad existente.',
    search: 'Buscar', unverified_device: 'Dispositivo no verificado',
    unverified_devices: 'Dispositivos no verificados',
  };

  function translateObj(target) {
    if (typeof target !== 'object' || target === null) return;
    for (const k of Object.keys(target)) {
      if (typeof target[k] === 'string') {
        const l = k.toLowerCase();
        if (SPANISH_DICT[l]) target[k] = SPANISH_DICT[l];
        else if (SPANISH_DICT[target[k].toLowerCase()]) target[k] = SPANISH_DICT[target[k].toLowerCase()];
      } else if (typeof target[k] === 'object') {
        translateObj(target[k]);
      }
    }
  }

  for (const ns of NAMESPACES) {
    const enFile = path.join(enDir, `${ns}.json`);
    const esFile = path.join(esDir, `${ns}.json`);
    let enData = {};
    if (fs.existsSync(enFile)) {
      try { enData = JSON.parse(fs.readFileSync(enFile, 'utf8')); } catch {}
    }
    const esData = JSON.parse(JSON.stringify(enData));
    translateObj(esData);

    if (ns === 'pages' && esData.client?.sidebar) {
      esData.client.sidebar.home = 'Inicio';
      esData.client.sidebar.explore_community = 'Explorar comunidad';
      esData.client.sidebar.mark_as_read = 'Marcar como leído';
      esData.client.sidebar.direct_messages = 'Mensajes directos';
      esData.client.sidebar.inbox = 'Bandeja de entrada';
      esData.client.sidebar.user_settings = 'Ajustes de usuario';
      esData.client.sidebar.add_space = 'Añadir espacio';
      esData.client.sidebar.create_space = 'Crear espacio';
      esData.client.sidebar.build_a_space_for_your_community = 'Crea un espacio para tu comunidad.';
      esData.client.sidebar.join_with_address = 'Unirse con dirección';
      esData.client.sidebar.become_a_part_of_existing_community = 'Forma parte de una comunidad existente.';
      esData.client.sidebar.search = 'Buscar';
      esData.client.sidebar.unverified_device = 'Dispositivo no verificado';
      esData.client.sidebar.unverified_devices = 'Dispositivos no verificados';
    }

    if (ns === 'features') {
      if (!esData.settings) esData.settings = {};
      esData.settings.settings = 'Configuración';
      esData.settings._general = 'General';
      esData.settings._account = 'Cuenta';
      esData.settings._notifications = 'Notificaciones';
      esData.settings._devices = 'Dispositivos';
      esData.settings.emojis_stickers = 'Emojis y Stickers';
      esData.settings.developer_tools = 'Herramientas de desarrollo';
      esData.settings.keybinds = 'Atajos de teclado';
      esData.settings.keybinds_reset_all = 'Restablecer todo';
      esData.settings.reset = 'Restablecer';
      esData.settings._about = 'Acerca de';
      esData.settings.logout = 'Cerrar sesión';

      esData.settings.keybinds_categories = {
        messages: 'Mensajes',
        navigation: 'Navegación',
        formatting: 'Formato',
        chat: 'Chat',
        input: 'Entrada',
        call: 'Llamada',
        media_viewer: 'Visor de multimedia',
        emoji_picker: 'Selector de emojis',
      };

      esData.settings.custom_css = {
        title: 'CSS personalizado',
        full_stylesheet: 'Hoja de estilo completa',
        edit_in_editor: 'Editar en editor de texto',
        download_css: 'Descargar archivo CSS',
        watching: 'Supervisando',
        stop_watching: 'Dejar de supervisar',
        export_file: 'Exportar archivo',
        import_file: 'Importar archivo',
        reload_last_edit: 'Recargar última edición',
        no_changes: 'Sin cambios respecto al archivo',
        changes_active: '{{count}} cambios activos',
        snippets: 'Fragmentos (Snippets)',
        snippets_description: 'Pequeño código CSS que se aplica después de todo lo demás, incluidas tus ediciones de hoja de estilo.',
        revert: 'Revertir',
        clear: 'Limpiar',
      };

      esData.settings.audio = {
        microphone: 'Micrófono',
        microphone_access: 'Acceso al micrófono',
        input_device: 'Dispositivo de entrada',
        input_device_description: 'Utilizado para mensajes de voz y llamadas. El predeterminado del sistema sigue lo que conectes.',
        show_devices: 'Mostrar dispositivos',
        system_default: 'Predeterminado del sistema',
        echo_cancellation: 'Cancelación de eco',
        noise_suppression: 'Supresión de ruido',
        noise_suppression_description: 'Desactivalo al grabar algo que no sea voz — trata la música como ruido.',
        auto_gain_control: 'Control automático de ganancia',
      };

      esData.settings.privacy = {
        privacy: 'Privacidad',
        hide_window_from_screen_capture: 'Ocultar ventana de la captura de pantalla',
        hide_window_description: 'Pide al sistema omitir esta ventana en capturas y grabaciones de pantalla.',
        block_all_incoming_invites: 'Bloquear todas las invitaciones entrantes',
        block_all_invites_description: 'Tu servidor rechaza las invitaciones a salas antes de que te lleguen. Requiere compatibilidad del servidor (MSC4155).',
        show_media_previews: 'Mostrar vistas previas de multimedia',
        show_media_previews_description: 'Cargar una vista previa la descarga del servidor del remitente, informándole que abriste el mensaje.',
        always: 'Siempre',
        private_rooms_only: 'Solo salas privadas',
        never: 'Nunca',
        show_avatars_in_invites: 'Mostrar avatares en invitaciones',
        show_avatars_description: 'Desactivalo para que una sala invitada por un desconocido no haga que tu cliente descargue su imagen.',
      };

      if (!esData.settings.general) esData.settings.general = {};
      Object.assign(esData.settings.general, {
        light: 'Claro',
        silver: 'Plateado',
        dark: 'Oscuro',
        butter: 'Manteca',
        default: 'Predeterminado',
        light_theme: 'Tema claro:',
        dark_theme: 'Tema oscuro:',
        twitter_emoji: 'Emojis de Twitter',
        page_zoom: 'Zoom de página',
        scroll_on_send: 'Desplazar al final al enviar',
        scroll_on_send_description: 'Al enviar un mensaje mientras estás arriba en el historial, vuelve automáticamente al final de la conversación.',
        hide_read_receipts: 'No enviar mis confirmaciones de lectura',
        hide_read_receipts_description: 'Envía tus confirmaciones de lectura en privado, sin revelar hasta dónde leíste. Seguirás viendo las de los demás.',
        hide_typing_status: 'No enviar mis notificaciones de escritura',
        hide_typing_status_description: 'Deja de avisar a las salas cuando estás redactando un mensaje. Seguirás viendo las de los demás.',
        hide_others_read_receipts: 'Ocultar confirmaciones de lectura de otros',
        hide_others_read_receipts_description: 'Deja de mostrar quién leyó hasta dónde. Independiente de si envías las tuyas.',
        hide_others_typing_status: 'Ocultar notificaciones de escritura de otros',
        hide_others_typing_status_description: 'Deja de mostrar la línea "X está escribiendo..." debajo de la conversación.',
        read_receipt_style: 'Estilo de confirmación de lectura',
        read_receipt_style_description: 'Predeterminado muestra quién sigue el chat en vivo. Element muestra puntos de avatar en el último mensaje leído de cada persona.',
        show_maps: 'Mostrar mapas para ubicaciones',
        show_maps_description: 'Muestra los mensajes de ubicación como mapa. Cada mapa descarga teselas del proveedor de mapas correspondiente.',
        render_bot_keyboards: 'Mostrar botones de bots',
        render_bot_keyboards_description: 'Muestra los botones que los bots adjuntan a sus mensajes.',
        confirm_bot_urls: 'Confirmar enlaces de bots',
        confirm_bot_urls_description: 'Preguntar antes de abrir un enlace proveniente del botón de un bot, mostrando el sitio de destino.',
        render_maths: 'Interpretar fórmulas matemáticas en LaTeX',
        render_maths_description: 'Muestra las fórmulas enviadas en formato LaTeX en lugar del texto sin procesar.',
        use_vxtwitter: 'Usar vxtwitter para Twitter/X',
        use_vxtwitter_description: 'Descarga contenido multimedia de Twitter/X mediante la API de vxtwitter para vistas previas completas de video e imagen.',
        use_soundcloak: 'Usar soundcloak para SoundCloud',
        use_soundcloak_description: 'Reescribe enlaces de SoundCloud para incrustaciones reproducibles.',
        use_bluesky_embeds: 'Incrustar publicaciones de Bluesky',
        use_bluesky_embeds_description: 'Descarga publicaciones de Bluesky del lado del cliente para mostrar tarjetas completas.',
        use_rule34_embeds: 'Incrustar publicaciones de Rule34',
        use_rule34_embeds_description: 'Muestra la imagen, GIF o video en línea en lugar de la tarjeta de enlace genérica.',
        use_reddit_embeds: 'Incrustar publicaciones de Reddit',
        use_reddit_embeds_description: 'Reproduce videos o muestra imágenes y galerías de Reddit directamente en la conversación.',
        use_hackernews_embeds: 'Incrustar publicaciones de Hacker News',
        use_hackernews_embeds_description: 'Construye tarjetas de Hacker News mediante su API oficial.',
        use_piped: 'Usar Piped para YouTube',
        use_piped_description: 'Reemplaza las reproducciones de YouTube con una instancia de Piped para mayor privacidad.',
        piped_instance: 'Instancia de Piped',
        piped_instance_description: 'Instancia de Piped desde la cual incrustar videos.',
        minimize_to_tray: 'Minimizar a la bandeja del sistema',
        minimize_to_tray_description: 'Al cerrar la ventana, se minimiza a la bandeja del sistema en lugar de salir.',
        start_at_login: 'Iniciar al iniciar sesión',
        start_at_login_description: 'Inicia la aplicación minimizada en la bandeja al iniciar sesión en el equipo.',
        client_preview_fallback: 'Vista previa de enlaces en el cliente (alternativa)',
        client_preview_fallback_description: 'Cuando el servidor no pueda generar una vista previa, la app descarga la página directamente para construir la tarjeta.',
        group_membership_changes: 'Agrupar cambios de membresía',
        group_membership_changes_description: 'Colapsa varias uniones, salidas y cambios de perfil consecutivos en una sola línea desplegable.',
        open_media_in_feed: 'Abrir multimedia en la galería',
        open_media_in_feed_description: 'Al pulsar una foto o video se abre la galería de archivos multimedia de la sala.',
        send_attachments_gallery: 'Enviar archivos adjuntos como galería',
        send_attachments_gallery_description: 'Varios archivos enviados a la vez forman un único mensaje en cuadrícula (MSC4274).',
        layout: 'Diseño',
        unified_home_sidebar: 'Barra lateral de inicio unificada',
        unified_home_sidebar_description: 'Muestra los mensajes directos y las salas sin espacio juntos en un solo lugar de Inicio.',
        dm_rail_buttons: 'Botones de mensajes directos en la barra lateral',
        dm_rail_buttons_description: 'Muestra mensajes directos no leídos como botones con avatar debajo de Inicio.',
        top_bar: 'Barra superior',
        top_bar_description: 'Una barra superior de ancho completo encima de la barra lateral con la bandeja de entrada.',
        top_bar_profile: 'Controles de perfil en la barra superior',
        top_bar_profile_description: 'Mueve tu avatar y los controles de estado a la barra superior.',
        default_inbox_tab: 'Pestaña predeterminada de la bandeja',
        default_inbox_tab_description: 'Pestaña en la que se abre la Bandeja de entrada de forma predeterminada.',
        rooms_pseudo_space: 'Espacio de salas',
        rooms_pseudo_space_description: 'Da a las salas sin espacio su propia entrada en la barra de espacios.',
        media: 'Multimedia',
        gif_picker: 'Buscador de GIFs',
        gif_picker_description: 'Agrega una pestaña de GIFs al selector de emojis.',
        emoji_mashup: 'Combinación de emojis (Emoji Mashup)',
        emoji_mashup_description: 'Agrega una pestaña de Emoji Kitchen al panel de emojis con miles de combinaciones de Google.',
        low_animation_mode: 'Modo de animaciones reducidas',
        low_animation_mode_description: 'Pausa la reproducción automática de multimedia y desactiva animaciones de la interfaz.',
        media_auto_embed_hosts: 'Servidores de video incrustado',
        media_auto_embed_hosts_description: 'Servidores separados por comas cuyos videos directos se reproducirán directamente en línea.',
        presence: 'Presencia',
        show_rich_presence: 'Mostrar Rich Presence',
        show_rich_presence_description: 'Muestra lo que otros están escuchando o jugando cuando lo compartan.',
        composer: 'Editor de mensajes',
        emoji_shortcode_replace: 'Reemplazar códigos de emojis',
        emoji_shortcode_replace_description: 'Convierte :codigo: a un emoji a medida que escribes.',
        spaces: 'Espacios',
        auto_join_space_rooms: 'Unirse automáticamente a salas del espacio',
        auto_join_space_rooms_description: 'Unirse a todas las salas que componen un espacio, incluidas las que se agreguen posteriormente.',
      });
    }

    fs.writeFileSync(esFile, JSON.stringify(esData, null, 2), 'utf8');
    console.log(`   [ok] es-ES/${ns}.json generado`);
  }
}

// 3. Actualizar src/app/i18n.ts
function updateI18nConfig(frontendDir) {
  const i18nPath = path.join(frontendDir, 'src', 'app', 'i18n.ts');
  console.log('⚙️  Actualizando src/app/i18n.ts...');

  const content = `import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend, { HttpBackendOptions } from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { trimTrailingSlash } from './utils/common';

export const NAMESPACES = ['components', 'features', 'pages', 'hooks', 'util'] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' }
] as const;

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init<HttpBackendOptions>({
    debug: false,
    fallbackLng: 'en-US',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    ns: NAMESPACES,
    interpolation: { escapeValue: false },
    backend: {
      loadPath: \`\${trimTrailingSlash(import.meta.env.BASE_URL)}/public/locales/{{lng}}/{{ns}}.json\`,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
`;
  fs.writeFileSync(i18nPath, content, 'utf8');
  console.log('   [ok] src/app/i18n.ts configurado.');
}

// 4. Parchear Menús de Ajustes (Settings.tsx y General.tsx)
function patchSettingsMenu(frontendDir) {
  console.log('⚙️  Parcheando menús de ajustes (Settings.tsx y General.tsx)...');

  // A. Settings.tsx
  const settingsPath = path.join(frontendDir, 'src', 'app', 'features', 'settings', 'Settings.tsx');
  if (fs.existsSync(settingsPath)) {
    let sContent = fs.readFileSync(settingsPath, 'utf8');

    sContent = sContent.replace(/(const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);\s*)+/g, 'const { t } = useTranslation();\n  ');

    if (!sContent.includes("from 'react-i18next'")) {
      sContent = `import { useTranslation } from 'react-i18next';\n` + sContent;
    }

    if (!sContent.includes("t('features:settings._general'")) {
      const startIdx = sContent.indexOf('const useSettingsMenuItems = (): SettingsMenuItem[] => {');
      const endIdx = sContent.indexOf('type SettingsProps = {');
      if (startIdx !== -1 && endIdx !== -1) {
        const newHook = `const useSettingsMenuItems = (): SettingsMenuItem[] => {
  const { t } = useTranslation();
  const isMobile = useScreenSizeContext() === ScreenSize.Mobile;
  return useMemo(
    () => [
      {
        page: SettingsPages.GeneralPage,
        name: t('features:settings._general', { defaultValue: 'General' }),
        icon: Icons.Setting,
      },
      {
        page: SettingsPages.AccountPage,
        name: t('features:settings._account', { defaultValue: 'Account' }),
        icon: Icons.User,
      },
      {
        page: SettingsPages.NotificationPage,
        name: t('features:settings._notifications', { defaultValue: 'Notifications' }),
        icon: Icons.Bell,
      },
      {
        page: SettingsPages.DevicesPage,
        name: t('features:settings._devices', { defaultValue: 'Devices' }),
        icon: Icons.Monitor,
      },
      {
        page: SettingsPages.EmojisStickersPage,
        name: t('features:settings.emojis_stickers', { defaultValue: 'Emojis & Stickers' }),
        icon: Icons.Smile,
      },
      {
        page: SettingsPages.DeveloperToolsPage,
        name: t('features:settings.developer_tools', { defaultValue: 'Developer Tools' }),
        icon: Icons.Terminal,
      },
      ...(isMobile
        ? []
        : [
            {
              page: SettingsPages.KeybindsPage,
              name: t('features:settings.keybinds', { defaultValue: 'Keybinds' }),
              icon: Icons.Alphabet,
            },
          ]),
      {
        page: SettingsPages.AboutPage,
        name: t('features:settings._about', { defaultValue: 'About' }),
        icon: Icons.Info,
      },
    ],
    [isMobile, t],
  );
};

`;
        sContent = sContent.substring(0, startIdx) + newHook + sContent.substring(endIdx);
      }
    }

    const hasTInSettings = /export\s+function\s+Settings\([^{]*\{[\s\S]*?const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);/.test(sContent);
    if (!hasTInSettings) {
      sContent = sContent.replace(
        /(export\s+function\s+Settings\s*\(\{[^}]*\}\s*:\s*SettingsProps\)\s*\{)/,
        `$1\n  const { t } = useTranslation();`
      );
    }

    sContent = sContent.replace(/(const\s+\{\s*t\s*\}\s*=\s*useTranslation\(\);\s*)+/g, 'const { t } = useTranslation();\n  ');

    if (!sContent.includes("t('features:settings.settings'")) {
      sContent = sContent.replace(/<Text size="H4" truncate>\s*Settings\s*<\/Text>/, `<Text size="H4" truncate>{t('features:settings.settings', { defaultValue: 'Settings' })}</Text>`);
    }
    if (!sContent.includes("t('features:settings.logout'")) {
      sContent = sContent.replace(/<Text size="B400">\s*Logout\s*<\/Text>/, `<Text size="B400">{t('features:settings.logout', { defaultValue: 'Logout' })}</Text>`);
    }

    fs.writeFileSync(settingsPath, sContent, 'utf8');
    console.log('   [ok] Settings.tsx traducido.');
  }

  // B. General.tsx
  const generalPath = path.join(frontendDir, 'src', 'app', 'features', 'settings', 'general', 'General.tsx');
  if (fs.existsSync(generalPath)) {
    let gContent = fs.readFileSync(generalPath, 'utf8');

    if (!gContent.includes("from 'react-i18next'")) {
      gContent = gContent.replace(
        /import\s+dayjs\s+from\s+'dayjs';/,
        `import dayjs from 'dayjs';\nimport { useTranslation } from 'react-i18next';\nimport { SUPPORTED_LANGUAGES } from '../../../i18n';`
      );
    }

    if (!gContent.includes('function LanguageSelector')) {
      const selectorCode = `
type LanguageSelectorProps = { disabled?: boolean; };
function LanguageSelector({ disabled }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [menuCords, setMenuCords] = useState<RectCords>();
  const currentLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language) ||
    SUPPORTED_LANGUAGES.find((lang) => i18n.language.startsWith(lang.code)) ||
    SUPPORTED_LANGUAGES[0];

  const handleMenuToggle: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuCords(menuCords ? undefined : evt.currentTarget.getBoundingClientRect());
  };

  const handleLanguageSelect = (languageCode: string) => {
    setMenuCords(undefined);
    i18n.changeLanguage(languageCode).catch(console.error);
  };

  return (
    <>
      <Button size="300" variant="Primary" outlined fill="Soft" radii="300" disabled={disabled} onClick={handleMenuToggle} after={<Icon size="300" src={Icons.ChevronBottom} />}>
        <Text size="T300">{currentLanguage.nativeName}</Text>
      </Button>
      <PopOut anchor={menuCords} offset={5} position="Bottom" align="End" content={
        <FocusTrap focusTrapOptions={{ initialFocus: false, onDeactivate: () => setMenuCords(undefined), clickOutsideDeactivates: true, escapeDeactivates: stopPropagation }}>
          <Menu>
            <Scroll style={{ maxHeight: '300px' }} variant="Surface" size="300" visibility="Hover" hideTrack>
              <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <MenuItem key={lang.code} size="300" variant={lang.code === currentLanguage.code ? 'Primary' : 'Surface'} radii="300" onClick={() => handleLanguageSelect(lang.code)}>
                    <Text size="T300" style={{ whiteSpace: 'nowrap' }}>{lang.nativeName} ({lang.name})</Text>
                  </MenuItem>
                ))}
              </Box>
            </Scroll>
          </Menu>
        </FocusTrap>
      } />
    </>
  );
}

function Language() {
  const { t } = useTranslation();
  return (
    <Box direction="Column" gap="100">
      <Text size="L400">{t('features:settings.general.language', { defaultValue: 'Language' })}</Text>
      <SequenceCard className={SequenceCardStyle} variant="SurfaceVariant" direction="Column">
        <SettingTile
          title={t('features:settings.general.language', { defaultValue: 'Language' })}
          description={t('features:settings.general.choose_your_preferred', { defaultValue: 'Elige tu idioma de visualización preferido.' })}
          after={<LanguageSelector />}
        />
      </SequenceCard>
    </Box>
  );
}
`;
      gContent = gContent.replace(/(export function General\(\{ requestClose \}: GeneralProps\) {)/, `${selectorCode}\n$1`);
      gContent = gContent.replace(/(<Box direction="Column" gap="700">\s*)(<Appearance \/>)/, `$1<Language />\n                $2`);
    }

    if (!gContent.includes("t('features:settings.general.general'")) {
      gContent = gContent.replace(/<Text size="H3" truncate>\s*General\s*<\/Text>/, `<Text size="H3" truncate>{t('features:settings.general.general', { defaultValue: 'General' })}</Text>`);
    }
    gContent = gContent.replace(/<Text size="L400">Appearance<\/Text>/g, `<Text size="L400">{t('features:settings.general.appearance', { defaultValue: 'Appearance' })}</Text>`);
    gContent = gContent.replace(/title="System Theme"/g, `title={t('features:settings.general.system_theme', { defaultValue: 'System Theme' })}`);
    gContent = gContent.replace(/title="Theme"/g, `title={t('features:settings.general.theme', { defaultValue: 'Theme' })}`);
    gContent = gContent.replace(/title="Monochrome Mode"/g, `title={t('features:settings.general.monochrome_mode', { defaultValue: 'Monochrome Mode' })}`);

    gContent = gContent.replace(/<Text size="L400">Date & Time<\/Text>/g, `<Text size="L400">{t('features:settings.general.date_time', { defaultValue: 'Date & Time' })}</Text>`);
    gContent = gContent.replace(/title="24-Hour Time Format"/g, `title={t('features:settings.general.24_hour_time_format', { defaultValue: '24-Hour Time Format' })}`);

    gContent = gContent.replace(/<Text size="L400">Editor<\/Text>/g, `<Text size="L400">{t('features:settings.general.editor', { defaultValue: 'Editor' })}</Text>`);
    gContent = gContent.replace(/title="ENTER for Newline"/g, `title={t('features:settings.general.enter_for_newline', { defaultValue: 'ENTER for Newline' })}`);
    gContent = gContent.replace(/title="Markdown Formatting"/g, `title={t('features:settings.general.markdown_formatting', { defaultValue: 'Markdown Formatting' })}`);
    gContent = gContent.replace(/title="Hide Typing & Read Receipts"/g, `title={t('features:settings.general.hide_typing_read_receipts', { defaultValue: 'Hide Typing & Read Receipts' })}`);

    gContent = gContent.replace(/<Text size="L400">Messages<\/Text>/g, `<Text size="L400">{t('features:settings.general.messages', { defaultValue: 'Messages' })}</Text>`);
    gContent = gContent.replace(/title="Message Layout"/g, `title={t('features:settings.general.message_layout', { defaultValue: 'Message Layout' })}`);
    gContent = gContent.replace(/title="Message Spacing"/g, `title={t('features:settings.general.message_spacing', { defaultValue: 'Message Spacing' })}`);
    gContent = gContent.replace(/title="Legacy Username Color"/g, `title={t('features:settings.general.legacy_username_color', { defaultValue: 'Legacy Username Color' })}`);
    gContent = gContent.replace(/title="Hide Membership Change"/g, `title={t('features:settings.general.hide_membership_change', { defaultValue: 'Hide Membership Change' })}`);
    gContent = gContent.replace(/title="Hide Profile Change"/g, `title={t('features:settings.general.hide_profile_change', { defaultValue: 'Hide Profile Change' })}`);
    gContent = gContent.replace(/title="Disable Media Auto Load"/g, `title={t('features:settings.general.disable_media_auto', { defaultValue: 'Disable Media Auto Load' })}`);
    gContent = gContent.replace(/title="Url Preview"/g, `title={t('features:settings.general.url_preview', { defaultValue: 'Url Preview' })}`);
    gContent = gContent.replace(/title="Show Hidden Events"/g, `title={t('features:settings.general.show_hidden_events', { defaultValue: 'Show Hidden Events' })}`);

    fs.writeFileSync(generalPath, gContent, 'utf8');
    console.log('   [ok] General.tsx traducido.');
  }
}

// 5. Parchear pestañas de la barra lateral
function patchSidebarTabs(frontendDir) {
  const sidebarDir = path.join(frontendDir, 'src', 'app', 'pages', 'client', 'sidebar');
  if (!fs.existsSync(sidebarDir)) return;

  console.log('⚙️  Parcheando pestañas de la barra lateral...');

  function ensureUseTranslation(filePath, componentNames) {
    if (!fs.existsSync(filePath)) return null;
    let code = fs.readFileSync(filePath, 'utf8');
    if (!code.includes("from 'react-i18next'")) {
      code = `import { useTranslation } from 'react-i18next';\n` + code;
    }
    for (const comp of componentNames) {
      const funcPattern = new RegExp(`(export\\s+function\\s+${comp}\\s*\\([^)]*\\)\\s*\\{)`);
      if (funcPattern.test(code)) {
        const afterFunc = code.split(funcPattern);
        if (afterFunc.length > 2 && !afterFunc[2].slice(0, 100).includes('useTranslation()')) {
          code = code.replace(funcPattern, `$1\n  const { t } = useTranslation();`);
        }
      }
    }
    return code;
  }

  // ExploreTab.tsx
  const explorePath = path.join(sidebarDir, 'ExploreTab.tsx');
  let expCode = ensureUseTranslation(explorePath, ['ExploreTab']);
  if (expCode) {
    if (!expCode.includes("t('pages:client.sidebar.explore_community'")) {
      expCode = expCode.replace(/tooltip="Explore Community"/g, `tooltip={t('pages:client.sidebar.explore_community', { defaultValue: 'Explore Community' })}`);
    }
    fs.writeFileSync(explorePath, expCode, 'utf8');
    console.log('   [ok] ExploreTab.tsx traducido.');
  }

  // InboxTab.tsx
  const inboxPath = path.join(sidebarDir, 'InboxTab.tsx');
  let inCode = ensureUseTranslation(inboxPath, ['InboxTab']);
  if (inCode) {
    if (!inCode.includes("t('pages:client.sidebar.inbox'")) {
      inCode = inCode.replace(/tooltip="Inbox"/g, `tooltip={t('pages:client.sidebar.inbox', { defaultValue: 'Inbox' })}`);
    }
    fs.writeFileSync(inboxPath, inCode, 'utf8');
    console.log('   [ok] InboxTab.tsx traducido.');
  }

  // DirectTab.tsx
  const directPath = path.join(sidebarDir, 'DirectTab.tsx');
  let dirCode = ensureUseTranslation(directPath, ['DirectTab']);
  if (dirCode) {
    if (dirCode.includes('const DirectMenu = forwardRef') && !dirCode.includes('const DirectMenu = forwardRef<HTMLDivElement, DirectMenuProps>(({ requestClose }, ref) => {\n  const { t } = useTranslation();')) {
      dirCode = dirCode.replace(
        /(const DirectMenu = forwardRef[^{]*\{)/,
        `$1\n  const { t } = useTranslation();`
      );
    }
    if (!dirCode.includes("t('pages:client.sidebar.direct_messages'")) {
      dirCode = dirCode.replace(/tooltip="Direct Messages"/g, `tooltip={t('pages:client.sidebar.direct_messages', { defaultValue: 'Direct Messages' })}`);
    }
    if (!dirCode.includes("t('pages:client.sidebar.mark_as_read'")) {
      dirCode = dirCode.replace(/>\s*Mark as Read\s*<\/Text>/g, `>{t('pages:client.sidebar.mark_as_read', { defaultValue: 'Mark as Read' })}</Text>`);
    }
    fs.writeFileSync(directPath, dirCode, 'utf8');
    console.log('   [ok] DirectTab.tsx traducido.');
  }

  // SearchTab.tsx
  const searchPath = path.join(sidebarDir, 'SearchTab.tsx');
  let sCode = ensureUseTranslation(searchPath, ['SearchTab']);
  if (sCode) {
    if (!sCode.includes("t('pages:client.sidebar.search'")) {
      sCode = sCode.replace(/tooltip="Search"/g, `tooltip={t('pages:client.sidebar.search', { defaultValue: 'Search' })}`);
    }
    fs.writeFileSync(searchPath, sCode, 'utf8');
    console.log('   [ok] SearchTab.tsx traducido.');
  }

  // CreateTab.tsx
  const createPath = path.join(sidebarDir, 'CreateTab.tsx');
  let crCode = ensureUseTranslation(createPath, ['CreateTab']);
  if (crCode) {
    crCode = crCode.replace(
      /\{t\('pages:client\.sidebar\.build_a_space_for_your_community',\s*\{\s*defaultValue:\s*['"]?\{?t\([^}]*\}['"]?\s*\}\)\}/g,
      `{t('pages:client.sidebar.build_a_space_for_your_community', { defaultValue: 'Build a space for your community.' })}`
    );
    crCode = crCode.replace(
      /\{t\('pages:client\.sidebar\.become_a_part_of_existing_community',\s*\{\s*defaultValue:\s*['"]?\{?t\([^}]*\}['"]?\s*\}\)\}/g,
      `{t('pages:client.sidebar.become_a_part_of_existing_community', { defaultValue: 'Become a part of existing community.' })}`
    );

    if (!crCode.includes("t('pages:client.sidebar.add_space'")) {
      crCode = crCode.replace(/tooltip="Add Space"/g, `tooltip={t('pages:client.sidebar.add_space', { defaultValue: 'Add Space' })}`);
    }
    if (!crCode.includes("t('pages:client.sidebar.create_space'")) {
      crCode = crCode.replace(/<Text size="H6">\s*Create Space\s*<\/Text>/g, `<Text size="H6">{t('pages:client.sidebar.create_space', { defaultValue: 'Create Space' })}</Text>`);
    }
    if (!crCode.includes("t('pages:client.sidebar.build_a_space_for_your_community'")) {
      crCode = crCode.replace(
        /(<Text size="T300" priority="300">\s*)Build a space for your community\.(\s*<\/Text>)/g,
        `$1{t('pages:client.sidebar.build_a_space_for_your_community', { defaultValue: 'Build a space for your community.' })}$2`
      );
    }
    if (!crCode.includes("t('pages:client.sidebar.join_with_address'")) {
      crCode = crCode.replace(/<Text size="H6">\s*Join with Address\s*<\/Text>/g, `<Text size="H6">{t('pages:client.sidebar.join_with_address', { defaultValue: 'Join with Address' })}</Text>`);
    }
    if (!crCode.includes("t('pages:client.sidebar.become_a_part_of_existing_community'")) {
      crCode = crCode.replace(
        /(<Text size="T300" priority="300">\s*)Become a part of existing community\.(\s*<\/Text>)/g,
        `$1{t('pages:client.sidebar.become_a_part_of_existing_community', { defaultValue: 'Become a part of existing community.' })}$2`
      );
    }
    fs.writeFileSync(createPath, crCode, 'utf8');
    console.log('   [ok] CreateTab.tsx traducido.');
  }

  // SettingsTab.tsx
  const setTabPath = path.join(sidebarDir, 'SettingsTab.tsx');
  let setCode = ensureUseTranslation(setTabPath, ['SettingsTab']);
  if (setCode) {
    if (!setCode.includes("t('pages:client.sidebar.user_settings'")) {
      setCode = setCode.replace(/tooltip="User Settings"/g, `tooltip={t('pages:client.sidebar.user_settings', { defaultValue: 'User Settings' })}`);
    }
    fs.writeFileSync(setTabPath, setCode, 'utf8');
    console.log('   [ok] SettingsTab.tsx traducido.');
  }
}

// Main execution flow
function main() {
  console.log('==============================================');
  console.log(' 🚀 Prinny Client i18n & Menu Auto-Patcher');
  console.log('==============================================');

  const frontendDir = resolveFrontendDir();
  console.log(`📁 Directorio objetivo: ${frontendDir}\n`);

  syncLocalesViaGit(frontendDir);
  createSpanishLocales(frontendDir);
  updateI18nConfig(frontendDir);
  patchSettingsMenu(frontendDir);
  patchSidebarTabs(frontendDir);

  // Ejecutar parche integral de componentes avanzados si existe
  const patchAllPath = path.join(path.dirname(frontendDir), 'scripts', 'patch-all-translations.mjs');
  if (fs.existsSync(patchAllPath)) {
    try {
      execSync(`node "${patchAllPath}"`, { stdio: 'inherit' });
    } catch (e) {
      console.warn('Advertencia ejecutando patch-all-translations.mjs:', e.message);
    }
  }

  console.log('\n==============================================');
  console.log(' ✅ ¡i18n y menús traducidos exitosamente!');
  console.log('==============================================\n');
}

main();
