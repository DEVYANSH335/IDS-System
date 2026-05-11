from scapy.all import sniff, IP, TCP, UDP
import time

traffic_log = []

def process_packet(packet):
    if IP in packet:
        src = packet[IP].src
        dst = packet[IP].dst
        proto = packet[IP].proto
        length = len(packet)

        traffic_log.append({
            "time": time.strftime("%H:%M:%S"),
            "traffic": length
        })

        # Keep last 50 entries
        if len(traffic_log) > 50:
            traffic_log.pop(0)

def start_sniffing():
    sniff(prn=process_packet, store=False)