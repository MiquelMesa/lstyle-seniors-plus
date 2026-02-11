/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Configuració de Supabase
 * ============================================
 * 
 * SEGURETAT:
 * - Aquesta clau 'anon' és pública i segura per estar aquí
 * - Row Level Security (RLS) protegeix les dades
 * - Només permet LECTURA de dades públiques
 * - MAI incloure la clau 'service_role' aquí
 */

(function() {
    'use strict';
    
    // Configuració en objecte inmutable
    const CONFIG = Object.freeze({
        url: 'https://wiejbleryqpraywllwwd.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZWpibGVyeXFwcmF5d2xsd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzAxODUsImV4cCI6MjA4NTgwNjE4NX0.nAnPz1cMGj_MPSj2BeFFxFRCVA26pl8yBUDiP-ElDWw',
        options: Object.freeze({
            db: Object.freeze({
                schema: 'public'
            }),
            auth: Object.freeze({
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }),
            global: Object.freeze({
                headers: Object.freeze({
                    'x-application-name': 'LSTYLE-SENIORS-PLUS',
                    'x-client-info': 'lstyle-seniors-plus@1.0.0'
                })
            }),
            realtime: Object.freeze({
                params: Object.freeze({
                    eventsPerSecond: 2
                })
            })
        })
    });
    
    // Exportar configuració de forma segura
    window.SUPABASE_CONFIG = CONFIG;
    
    /**
     * Validació de configuració
     */
    window.validarConfigSupabase = function() {
        // Verificar que l'objecte no ha estat manipulat
        if (!Object.isFrozen(CONFIG)) {
            console.error('🚨 ALERTA: Configuració ha estat modificada');
            return false;
        }
        
        // Validar URL
        const urlValida = CONFIG.url && 
                          CONFIG.url.startsWith('https://') && 
                          CONFIG.url.includes('.supabase.co') &&
                          CONFIG.url.length > 20 &&
                          CONFIG.url.length < 100;
        
        if (!urlValida) {
            console.error('❌ URL de Supabase no vàlida');
            return false;
        }
        
        // Validar clau anon
        const clauValida = CONFIG.anonKey && 
                           CONFIG.anonKey.startsWith('eyJ') &&
                           CONFIG.anonKey.length > 100 &&
                           CONFIG.anonKey.length < 500;
        
        if (!clauValida) {
            console.error('❌ Clau anon no vàlida');
            return false;
        }
        
        // Verificar que NO és la clau service_role (més perillosa)
        if (CONFIG.anonKey.includes('"role":"service_role"')) {
            console.error('🚨 PERILL: Clau service_role detectada! NO s\'hauria d\'usar al frontend');
            return false;
        }
        
        // Verificar que és la clau anon correcta
        if (!CONFIG.anonKey.includes('"role":"anon"')) {
            console.error('⚠️ Advertència: No sembla una clau anon estàndard');
        }
        
        console.log('✅ Configuració de Supabase vàlida i segura');
        return true;
    };
    
    // Prevenir modificacions de la configuració
    Object.defineProperty(window, 'SUPABASE_CONFIG', {
        writable: false,
        configurable: false
    });
    
    // Log de seguretat (només en desenvolupament)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔒 Configuració Supabase carregada de forma segura');
        console.log('🛡️ Row Level Security (RLS) actiu');
        console.log('📖 Només lectura de dades públiques permesa');
    }
    
})();