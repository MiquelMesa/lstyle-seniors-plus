/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Configuració de Supabase
 * ============================================
 * 
 * MOLT IMPORTANT: 
 * - Canviar SUPABASE_URL amb la URL de projecte
 * - Canviar SUPABASE_ANON_KEY amb la clau pública
 * - ATENCIO MAI compartir la service_role key aquí!!
 */

/**
 * LSTYLE-SENIORS-PLUS
 * Configuracio de Supabase
 */

const SUPABASE_CONFIG = {

    url: 'https://wiejbleryqpraywllwwd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZWpibGVyeXFwcmF5d2xsd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzAxODUsImV4cCI6MjA4NTgwNjE4NX0.nAnPz1cMGj_MPSj2BeFFxFRCVA26pl8yBUDiP-ElDWw',
    options: {
        db: {
            schema: 'public'
        },
        auth: {
            persistSession: false
        },
        global: {
            headers: {
                'x-application-name': 'LSTYLE-SENIORS-PLUS'
            }
        }
    }
};

function validarConfigSupabase() {
    const urlValida = SUPABASE_CONFIG.url && 
                      SUPABASE_CONFIG.url.startsWith('https://') && 
                      SUPABASE_CONFIG.url.includes('.supabase.co');
    
    const clauValida = SUPABASE_CONFIG.anonKey && 
                       SUPABASE_CONFIG.anonKey.startsWith('eyJ') &&
                       SUPABASE_CONFIG.anonKey.length > 100;
    
    if (!urlValida || !clauValida) {
        console.error('Error: Configuracio de Supabase incorrecta');
        return false;
    }
    
    console.log('Configuracio de Supabase valida');
    return true;
}