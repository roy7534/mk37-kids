import SwiftUI
import WebKit

// Hosts the bundled `web` folder (added to Xcode as a blue "folder reference") in a WKWebView.
struct PianoWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.userContentController.add(context.coordinator, name: "midi")

        let web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 0.56, green: 0.83, blue: 1, alpha: 1)
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.uiDelegate = context.coordinator
        context.coordinator.webView = web

        if let index = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") {
            web.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
        } else {
            web.loadHTMLString("<h1 style='font-size:40px'>חסרה תיקיית web בפרויקט</h1>", baseURL: nil)
        }
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler, WKUIDelegate {
        weak var webView: WKWebView?
        let midi = MIDIBridge()

        override init() {
            super.init()
            midi.onEvent = { [weak self] status, d1, d2 in
                DispatchQueue.main.async {
                    self?.webView?.evaluateJavaScript("window.nativeMidi && window.nativeMidi(\(status),\(d1),\(d2))")
                }
            }
            midi.onStatus = { [weak self] text in
                DispatchQueue.main.async {
                    self?.webView?.evaluateJavaScript("window.nativeMidiStatus && window.nativeMidiStatus('\(text)')")
                }
            }
        }

        // JS calls window.webkit.messageHandlers.midi.postMessage('start') after the first tap.
        func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "midi" { midi.start() }
        }

        // Allow the microphone fallback without an extra web prompt.
        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                     decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(.grant)
        }

        // JS confirm() (used for "delete song" / "reset") needs a native dialog inside WKWebView.
        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "ביטול", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "אישור", style: .destructive) { _ in completionHandler(true) })
            topController()?.present(alert, animated: true)
        }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "אישור", style: .default) { _ in completionHandler() })
            topController()?.present(alert, animated: true)
        }

        private func topController() -> UIViewController? {
            let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene
            var top = scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
            while let presented = top?.presentedViewController { top = presented }
            return top
        }
    }
}
