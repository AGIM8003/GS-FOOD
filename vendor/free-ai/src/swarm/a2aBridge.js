/*
 * Secure Agent-to-Agent (A2A) Orchestrator Bridge
 * Facilitates safe, cryptographically verifiable negotiations between FREE AI swarms
 * and external vendor agents or decoupled sub-systems via MCP context.
 */

import crypto from 'crypto';
import { verifyMcpGovernance } from './mcpGovernance.js';

export class A2ABridge {
  constructor(localIdentity, options = {}) {
    this.localIdentity = localIdentity; // e.g. "free-ai-manufacturing-node-1"
    this.strictMode = options.strictMode || true;
    this.activeTransactions = new Map();
  }

  /**
   * Initializes a negotiation sequence with a remote agent.
   * @param {string} remoteIdentity 
   * @param {Object} proposalPayload 
   */
  async initiateNegotiation(remoteIdentity, proposalPayload) {
    const transactionId = crypto.randomUUID();
    
    // In a real environment, this would hit an external endpoint or pub/sub layer
    const outboundPacket = {
      transactionId,
      sender: this.localIdentity,
      receiver: remoteIdentity,
      timestamp: Date.now(),
      payload: proposalPayload
    };

    this.activeTransactions.set(transactionId, {
      status: 'pending',
      remoteIdentity,
      startedAt: Date.now()
    });

    console.log(`[A2A Bridge] Negotiation ${transactionId} initiated with ${remoteIdentity}`);
    return outboundPacket;
  }

  /**
   * Receives and validates an incoming response or counter-proposal from a remote agent.
   * @param {Object} incomingPacket 
   */
  async processIncomingPacket(incomingPacket) {
    const { transactionId, sender, payload, signature, c2pa_manifest } = incomingPacket;

    if (!transactionId || sender === this.localIdentity) {
      throw new Error("Invalid A2A packet structure.");
    }

    if (this.strictMode) {
      // Hardware-Symbiosis Requirement: Verify C2PA provenance and technical bounds
      const governancePassed = await verifyMcpGovernance(payload, c2pa_manifest, signature);
      if (!governancePassed) {
        console.warn(`[A2A Bridge] Packet rejected from ${sender}! Governance failure.`);
        return { status: 'rejected', reason: 'governance_verification_failed' };
      }
    }

    if (this.activeTransactions.has(transactionId)) {
      this.activeTransactions.set(transactionId, {
        status: 'active',
        remoteIdentity: sender,
        lastPayload: payload,
        updatedAt: Date.now()
      });
      console.log(`[A2A Bridge] Transaction ${transactionId} updated by ${sender}`);
    } else {
      // Unsolicited incoming packet
      console.log(`[A2A Bridge] Received unsolicited proposal from ${sender}`);
    }

    return { status: 'accepted', payload };
  }
}
