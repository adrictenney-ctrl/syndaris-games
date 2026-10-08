package com.playondisplay.tv;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Play On Display for TVs: a full-screen window onto the Play On Display website, which runs
 * the table. The remote's arrows and OK button drive the page's own TV navigation; Back
 * asks the page first (so a game in progress isn't left by accident), then goes back a page,
 * then closes the app.
 */
public class MainActivity extends Activity {

    private static final String HOME = "https://playondisplay.com/?tv=1";
    private static final String HOST = "playondisplay.com";

    private WebView web;
    private boolean showingError = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0c0b0a"));
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);            // the table saves its game here
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        // Lets the site know it's inside the TV app (TV layout, remote navigation).
        s.setUserAgentString(s.getUserAgentString() + " PlayOnDisplayTV/1.1");

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Stay inside the app for our own pages; ignore anything else.
                Uri u = request.getUrl();
                return !HOST.equals(u.getHost()) && !"about".equals(u.getScheme()) && !"data".equals(u.getScheme());
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showOffline();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                view.requestFocus();
            }
        });

        setContentView(web);
        hideSystemBars();
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(HOME);
    }

    private void showOffline() {
        showingError = true;
        String page = "<html><body style='margin:0;height:100vh;display:grid;place-items:center;"
                + "background:#0c0b0a;color:#f5eedd;font-family:Georgia,serif;text-align:center'>"
                + "<div><h1 style='font-weight:400;font-size:6vmin;margin:0'>Can't reach the table</h1>"
                + "<p style='font-size:3vmin;color:#dabc76'>Play On Display needs an internet connection.</p>"
                + "<button autofocus onclick=\"location.href='" + HOME + "'\" style='margin-top:3vmin;font-size:3vmin;"
                + "padding:1.5vmin 5vmin;border-radius:1vmin;border:0;background:#c9a257;color:#2a1d08;"
                + "outline:.6vmin solid #ffd66b;outline-offset:.5vmin'>Try again</button></div></body></html>";
        web.loadDataWithBaseURL("about:blank", page, "text/html", "utf-8", null);
    }

    private void hideSystemBars() {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Some remotes send "select"/"OK" codes WebView doesn't treat as Enter.
        int code = event.getKeyCode();
        if (code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_BUTTON_A
                || code == KeyEvent.KEYCODE_NUMPAD_ENTER) {
            KeyEvent enter = new KeyEvent(event.getDownTime(), event.getEventTime(), event.getAction(),
                    KeyEvent.KEYCODE_ENTER, event.getRepeatCount(), event.getMetaState());
            return web.dispatchKeyEvent(enter);
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (showingError) {
            finish();
            return;
        }
        // Let the page decide first (it warns before leaving a game in progress).
        web.evaluateJavascript("window.podBack ? window.podBack() : false", result -> {
            if ("true".equals(result)) return;
            if (web.canGoBack()) web.goBack();
            else finish();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        if (Build.VERSION.SDK_INT >= 19) hideSystemBars();
    }

    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }
}
