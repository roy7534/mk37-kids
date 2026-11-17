import SwiftUI
import AVFoundation

// Native iPad shell: shows the web app full-screen and feeds it real MIDI from the organ over USB-C.
@main
struct NotiPianoApp: App {
    init() {
        // Play sound even when the silent switch is on, and mix nicely with speech.
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        // Keep the screen awake while the child plays.
        UIApplication.shared.isIdleTimerDisabled = true
    }

    var body: some Scene {
        WindowGroup {
            PianoWebView()
                .ignoresSafeArea()
                .statusBarHidden(true)
                .persistentSystemOverlays(.hidden)
        }
    }
}
