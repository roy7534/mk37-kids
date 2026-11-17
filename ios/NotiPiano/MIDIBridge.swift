import CoreMIDI

// Listens to every MIDI source (the MK37 appears as a USB MIDI device when plugged into the iPad's USB-C port)
// and forwards MIDI 1.0 channel-voice messages (note on/off) as (status, data1, data2).
final class MIDIBridge {
    var onEvent: ((UInt8, UInt8, UInt8) -> Void)?
    var onStatus: ((String) -> Void)?

    private var client = MIDIClientRef()
    private var inPort = MIDIPortRef()
    private var started = false

    func start() {
        guard !started else { connectAll(); return }
        started = true

        // Re-scan when a device is plugged in or unplugged.
        MIDIClientCreateWithBlock("NotiPiano" as CFString, &client) { [weak self] notification in
            if notification.pointee.messageID == .msgSetupChanged { self?.connectAll() }
        }

        MIDIInputPortCreateWithProtocol(client, "NotiPianoIn" as CFString, ._1_0, &inPort) { [weak self] eventList, _ in
            self?.handle(eventList)
        }
        connectAll()
    }

    private func connectAll() {
        let count = MIDIGetNumberOfSources()
        for i in 0..<count {
            MIDIPortConnectSource(inPort, MIDIGetSource(i), nil)
        }
        onStatus?(count > 0 ? "מחובר (USB)" : "לא נמצא אורגן")
    }

    private func handle(_ list: UnsafePointer<MIDIEventList>) {
        for packet in list.unsafeSequence() {
            let wordCount = Int(packet.pointee.wordCount)
            withUnsafeBytes(of: packet.pointee.words) { raw in
                let words = raw.bindMemory(to: UInt32.self)
                for i in 0..<min(wordCount, words.count) {
                    let w = words[i]
                    // Universal MIDI Packet type 0x2 = MIDI 1.0 channel voice message (32-bit).
                    guard (w >> 28) == 0x2 else { continue }
                    let status = UInt8((w >> 16) & 0xFF)
                    let d1 = UInt8((w >> 8) & 0x7F)
                    let d2 = UInt8(w & 0x7F)
                    let kind = status & 0xF0
                    if kind == 0x90 || kind == 0x80 { onEvent?(status, d1, d2) }
                }
            }
        }
    }
}
