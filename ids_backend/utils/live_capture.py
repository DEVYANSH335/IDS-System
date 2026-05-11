# -------------------------------
# IMPORTS
# (REPLACES YOUR CURRENT IMPORTS)
# -------------------------------

from scapy.all import sniff, IP
from model import predict
import time
import psutil


# -------------------------------
# FLOW STORAGE
# (SAME PURPOSE AS YOUR CODE)
# -------------------------------

flows = {}

FLOW_TIMEOUT = 10


# -------------------------------
# AUTO DETECT NETWORK INTERFACE
# (NEW SECTION)
# This allows anyone to run the IDS
# without manually specifying WiFi
# -------------------------------

def get_active_interface():

    interfaces = psutil.net_if_stats()

    for iface, data in interfaces.items():
        if data.isup and iface != "lo":
            return iface

    return None


# -------------------------------
# FEATURE EXTRACTION
# (REPLACES YOUR extract_features)
# -------------------------------

def extract_features(flow):

    duration = time.time() - flow["start"]

    packets = flow["packets"]
    bytes_total = flow["bytes"]

    bytes_per_sec = bytes_total / duration if duration > 0 else 0
    packets_per_sec = packets / duration if duration > 0 else 0

    return [
        duration,
        packets,
        bytes_total,
        bytes_per_sec,
        packets_per_sec
    ]


# -------------------------------
# ALERT LOGGER
# (NEW SECTION)
# Saves attacks to a log file
# -------------------------------

def log_attack(src, dst, confidence):

    with open("alerts.log", "a") as f:

        f.write(
            f"{time.ctime()} ATTACK {src} -> {dst} confidence={confidence}\n"
        )


# -------------------------------
# PACKET PROCESSING
# (REPLACES YOUR process_packet)
# -------------------------------

def process_packet(packet):

    if IP not in packet:
        return

    src = packet[IP].src
    dst = packet[IP].dst
    proto = packet[IP].proto

    flow_id = (src, dst, proto)

    if flow_id not in flows:

        flows[flow_id] = {
            "start": time.time(),
            "packets": 0,
            "bytes": 0
        }

    flows[flow_id]["packets"] += 1
    flows[flow_id]["bytes"] += len(packet)

    duration = time.time() - flows[flow_id]["start"]

    if duration > FLOW_TIMEOUT:

        features = extract_features(flows[flow_id])

        result = predict(features)

        if result["label"] == "Intrusion Detected":

            print("\n⚠ NETWORK ATTACK DETECTED")
            print(src, "→", dst)
            print("Confidence:", result["confidence"])

            log_attack(src, dst, result["confidence"])

        del flows[flow_id]


# -------------------------------
# START IDS CAPTURE
# (REPLACES YOUR start_capture)
# -------------------------------

def start_capture():

    iface = get_active_interface()

    if iface is None:
        print("No active network interface found")
        return

    print("Starting real-time IDS...")
    print("Monitoring interface:", iface)

    sniff(
        iface=iface,
        prn=process_packet,
        store=False
    )