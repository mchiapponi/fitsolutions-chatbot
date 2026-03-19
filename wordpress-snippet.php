// ============================================================
// FIT SOLUTIONS CHATBOT WIDGET
// Inserisce il widget chat su tutte le pagine.
// Cambia l'URL con quello del tuo deploy Vercel.
// ============================================================
add_action('wp_footer', function() {
    // URL del backend chatbot (Vercel)
    $backend = 'https://fitsolutions-chatbot.vercel.app'; // ← CAMBIA CON IL TUO URL
    ?>
    <script>
    (function(){
        var s=document.createElement('script');
        s.src='<?php echo esc_url($backend); ?>/widget.js';
        s.async=true;
        s.dataset.endpoint='<?php echo esc_url($backend); ?>/api/chat';
        s.dataset.title='Fit Solutions';
        s.dataset.subtitle='Assistente virtuale';
        s.dataset.color='#1F7A7A';
        s.dataset.welcome='Ciao! 👋 Sono l\'assistente Fit Solutions. Come posso aiutarti?';
        document.head.appendChild(s);
    })();
    </script>
    <?php
}, 99);
