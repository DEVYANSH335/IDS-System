from scapy.all import sniff, IP, TCP, UDP, ICMP
import time
import numpy as np
import socket

# Detect local IP
hostname = socket.gethostname()
LOCAL_IP = socket.gethostbyname(hostname)

print("IDS host IP:", LOCAL_IP)

flows = {}
alerts = []
traffic_stats = []
attack_sources = {}
traffic_distribution = {
    "normal": 0,
    "malicious": 0
}
traffic_analysis = []

FLOW_TIMEOUT = 10


def add_demo_attack():
    timestamp = time.strftime("%H:%M:%S")
    source = "203.0.113.10"

    traffic_stats.append({
        "time": timestamp,
        "traffic": 1480
    })

    if len(traffic_stats) > 50:
        traffic_stats.pop(0)

    traffic_distribution["malicious"] += 1

    alerts.append({
        "id": str(time.time_ns()),
        "type": "critical",
        "message": "Demo Intrusion Detected (confidence: 0.93)",
        "source": source,
        "timestamp": timestamp
    })

    attack_sources[source] = attack_sources.get(source, 0) + 1

    traffic_analysis.insert(0, {
        "id": str(time.time_ns()),
        "flowId": f"{source}->{LOCAL_IP}:445",
        "protocol": "TCP",
        "packetRate": 8362.33,
        "flowDuration": 4.09,
        "prediction": "Attack",
        "confidence": 93,
        "timestamp": timestamp
    })

    if len(traffic_analysis) > 200:
        traffic_analysis.pop()

    return {
        "message": "Demo attack injected",
        "source": source,
        "timestamp": timestamp
    }


class Flow:
    def __init__(self, src, dst, dst_port, protocol):
        self.src = src
        self.dst = dst
        self.dst_port = dst_port
        self.protocol = protocol
        self.start_time = time.time()
        self.last_time = self.start_time
        self.packet_lengths = []
        self.timestamps = []

    def add_packet(self, length):
        now = time.time()
        self.packet_lengths.append(length)
        self.timestamps.append(now)
        self.last_time = now

    def extract_features(self):
        duration = self.last_time - self.start_time

        if len(self.timestamps) > 1:
            iats = np.diff(self.timestamps)
            iat_std = float(np.std(iats))
        else:
            iat_std = 0.0

        return {
            "Dst Port": self.dst_port,
            "Flow Duration": duration,
            "Flow IAT Std": iat_std,
            "Packet Length Mean": float(np.mean(self.packet_lengths)),
            "Packet Length Std": float(np.std(self.packet_lengths)),
            "Total Packets": len(self.packet_lengths)
        }


def process_packet(packet, model=None, scaler=None, features=None):

    if IP not in packet:
        return

    src = packet[IP].src
    dst = packet[IP].dst

    # Ignore your own machine traffic
    if src == LOCAL_IP:
        return

    dst_port = 0
    if TCP in packet:
        dst_port = packet[TCP].dport
        protocol = "TCP"
    elif UDP in packet:
        dst_port = packet[UDP].dport
        protocol = "UDP"
    elif ICMP in packet:
        protocol = "ICMP"
    else:
        protocol = str(packet[IP].proto)

    key = (src, dst, dst_port, protocol)

    if key not in flows:
        flows[key] = Flow(src, dst, dst_port, protocol)

    flows[key].add_packet(len(packet))

    # Update traffic graph
    traffic_stats.append({
        "time": time.strftime("%H:%M:%S"),
        "traffic": len(packet)
    })

    if len(traffic_stats) > 50:
        traffic_stats.pop(0)

    flow = flows[key]

    # Process flow after timeout
    if time.time() - flow.start_time > FLOW_TIMEOUT:

        # Ignore very small flows (reduces noise)
        if len(flow.packet_lengths) < 5:
            del flows[key]
            return

        features_dict = flow.extract_features()

        try:
            X = [[features_dict.get(f, 0) for f in features]]
            X = scaler.transform(X)

            prob = model.predict_proba(X)[0][1]
            is_attack = prob > 0.85

            traffic_analysis.insert(0, {
                "id": str(time.time_ns()),
                "flowId": f"{src}->{dst}:{flow.dst_port}",
                "protocol": flow.protocol,
                "packetRate": round(len(flow.packet_lengths) / max(features_dict["Flow Duration"], 0.001), 2),
                "flowDuration": round(features_dict["Flow Duration"], 2),
                "prediction": "Attack" if is_attack else "Normal",
                "confidence": round((prob if is_attack else 1 - prob) * 100),
                "timestamp": time.strftime("%H:%M:%S")
            })

            if len(traffic_analysis) > 200:
                traffic_analysis.pop()

            # Threshold to avoid false positives
            if is_attack:
                traffic_distribution["malicious"] += 1

                alerts.append({
                    "id": str(len(alerts)),
                    "type": "critical",
                    "message": f"Intrusion Detected (confidence: {round(prob, 2)})",
                    "source": src,
                    "timestamp": time.strftime("%H:%M:%S")
                })

                # Track attacker IPs (exclude local IP)
                if src != LOCAL_IP:
                    if src not in attack_sources:
                        attack_sources[src] = 0
                    attack_sources[src] += 1
            else:
                traffic_distribution["normal"] += 1

        except Exception as e:
            print("Prediction error:", e)

        # Clean up flow
        del flows[key]


def start_sniffer(model=None, scaler=None, features=None):

    sniff(
        prn=lambda p: process_packet(p, model, scaler, features),
        store=False
    )
