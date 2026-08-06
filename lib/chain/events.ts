import { xdr } from '@stellar/stellar-sdk';
import {
  amountFromScVal,
  addressFromScVal,
  scvalMapEntries,
  scvalToText,
  scvalVecItems,
  scvalArm,
} from './scval';

/**
 * Decode a project/record identifier payload. Identifiers may be emitted as
 * addresses (the SDK encodes project IDs as `Address` values), raw 32-byte
 * hex, or plain strings — accept all three forms.
 */
function idFromScVal(scv: xdr.ScVal): string {
  switch (scvalArm(scv)) {
    case 'scvAddress':
      return addressFromScVal(scv);
    case 'scvBytes':
      return scv.bytes().toString('hex');
    default:
      return scvalToText(scv);
  }
}

/**
 * Protocol event schemas.
 *
 * Soroban contracts emit events as a topic (a list of ScVals, the first of
 * which is conventionally the event-name symbol) plus a single data ScVal.
 * These decoders interpret the events emitted by the Cambium contracts:
 *
 * Retirement contract (`retire`):
 *   topic: [symbol("retire"), address(projectId), u32(vintageYear)]
 *   data:  map { id, amount: i128, retired_at: u64, retiree: address }
 *
 * Registry contract (`register_project`):
 *   topic: [symbol("register_project"), address(projectId)]
 *   data:  map { id, methodology, geography, external_registry_ref?,
 *                verifying_key_version: u32 }
 *
 * Credit token / SEP-41 (`transfer`, `mint`, `burn`):
 *   topic: [symbol("transfer"), address(from), address(to)]
 *   data:  i128 amount
 *
 * Decoders are tolerant: they accept both the documented `map` layout and a
 * positional `vec` layout, and return `null` when an event does not match the
 * schema (rather than throwing), so a single indexer can skip unrelated
 * events from the same contract safely.
 */

export const RETIRE_EVENT_NAME = 'retire';
export const REGISTER_PROJECT_EVENT_NAME = 'register_project';
export const TRANSFER_EVENT_NAME = 'transfer';
export const MINT_EVENT_NAME = 'mint';
export const BURN_EVENT_NAME = 'burn';

/** A contract event as returned by `server.getEvents` / transaction meta. */
export interface RawContractEvent {
  eventId: string;
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
  pagingToken: string;
  contractId: string;
  inSuccessfulContractCall: boolean;
  topic: xdr.ScVal[];
  value: xdr.ScVal;
}

export interface RetirementEvent {
  kind: 'retirement';
  recordId: string;
  projectId: string;
  vintageYear: number;
  amount: string;
  retiredAt: number;
  retiree: { type: 'public'; address: string } | { type: 'shielded'; nullifierHash: string };
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
}

export interface ProjectEvent {
  kind: 'project';
  id: string;
  methodology: string;
  geography: string;
  externalRegistryRef?: string;
  verifyingKeyVersion: number;
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
}

export interface TransferEvent {
  kind: 'transfer';
  from: string;
  to: string;
  amount: string;
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
}

export type DecodedEvent = RetirementEvent | ProjectEvent | TransferEvent;

/** The first topic entry is the event-name symbol, e.g. "retire". */
export function eventNameFromTopic(topic: xdr.ScVal[]): string {
  const first = topic[0];
  if (!first) return '';
  if (scvalArm(first) === 'scvSymbol' || scvalArm(first) === 'scvString') {
    return scvalToText(first);
  }
  return '';
}

function rawToBase(evt: RawContractEvent) {
  return {
    txHash: evt.txHash,
    ledger: evt.ledger,
    ledgerClosedAt: evt.ledgerClosedAt,
  };
}

function decodeRetiree(value: xdr.ScVal | undefined): RetirementEvent['retiree'] {
  if (!value) return { type: 'public', address: '' };
  const arm = scvalArm(value);
  if (arm === 'scvAddress') {
    return { type: 'public', address: addressFromScVal(value) };
  }
  if (arm === 'scvBytes') {
    return { type: 'shielded', nullifierHash: value.bytes().toString('hex') };
  }
  const text = scvalToText(value);
  if (arm === 'scvString' || arm === 'scvSymbol') {
    return { type: 'public', address: text };
  }
  return { type: 'public', address: text };
}

/**
 * Decode a `retire` event into a retirement record. Returns `null` when the
 * event does not match the retirement schema.
 */
export function decodeRetirementEvent(evt: RawContractEvent): RetirementEvent | null {
  const topic = evt.topic;
  if (eventNameFromTopic(topic) !== RETIRE_EVENT_NAME) return null;

  const projectIdScv = topic[1];
  const vintageScv = topic[2];
  if (!projectIdScv || !vintageScv) return null;

  let id = '';
  let amount = '0';
  let retiredAt = 0;
  let retiree: RetirementEvent['retiree'] = { type: 'public', address: '' };

  const entries = scvalMapEntries(evt.value);
  if (entries.length > 0) {
    const pick = (key: string) => entries.find((e) => e.key === key)?.value;
    id = idFromScVal(pick('id') ?? xdr.ScVal.scvVoid());
    const amountScv = pick('amount');
    if (amountScv) amount = amountFromScVal(amountScv);
    const retiredAtScv = pick('retired_at') ?? pick('timestamp');
    if (retiredAtScv) retiredAt = Number(scvalToText(retiredAtScv));
    retiree = decodeRetiree(pick('retiree') ?? pick('retiree_address'));
  } else {
    const items = scvalVecItems(evt.value);
    id = idFromScVal(items[0] ?? xdr.ScVal.scvVoid());
    if (items[1]) amount = amountFromScVal(items[1]);
    if (items[2]) retiredAt = Number(scvalToText(items[2]));
    retiree = decodeRetiree(items[3]);
  }

  if (!id) return null;

  return {
    kind: 'retirement',
    recordId: id,
    projectId: idFromScVal(projectIdScv),
    vintageYear: Number(scvalToText(vintageScv)),
    amount,
    retiredAt,
    retiree,
    ...rawToBase(evt),
  };
}

/**
 * Decode a `register_project` event into a project record. Returns `null`
 * when the event does not match the project registration schema.
 */
export function decodeProjectEvent(evt: RawContractEvent): ProjectEvent | null {
  const topic = evt.topic;
  if (eventNameFromTopic(topic) !== REGISTER_PROJECT_EVENT_NAME) return null;

  const idScv = topic[1];
  if (!idScv) return null;

  let methodology = '';
  let geography = '';
  let externalRegistryRef: string | undefined;
  let verifyingKeyVersion = 0;

  const entries = scvalMapEntries(evt.value);
  if (entries.length > 0) {
    const pick = (key: string) => entries.find((e) => e.key === key)?.value;
    methodology = scvalToText(pick('methodology') ?? xdr.ScVal.scvVoid());
    geography = scvalToText(pick('geography') ?? xdr.ScVal.scvVoid());
    const refScv = pick('external_registry_ref') ?? pick('external_registry_ref');
    if (refScv && scvalArm(refScv) !== 'scvVoid') {
      externalRegistryRef = scvalToText(refScv);
    }
    const vkvScv = pick('verifying_key_version') ?? pick('verifying_key_version');
    if (vkvScv) verifyingKeyVersion = Number(scvalToText(vkvScv));
  } else {
    const items = scvalVecItems(evt.value);
    methodology = scvalToText(items[0] ?? xdr.ScVal.scvVoid());
    geography = scvalToText(items[1] ?? xdr.ScVal.scvVoid());
    if (items[2] && scvalArm(items[2]) !== 'scvVoid') {
      externalRegistryRef = scvalToText(items[2]);
    }
    if (items[3]) verifyingKeyVersion = Number(scvalToText(items[3]));
  }

  return {
    kind: 'project',
    id: idFromScVal(idScv),
    methodology,
    geography,
    externalRegistryRef,
    verifyingKeyVersion,
    ...rawToBase(evt),
  };
}

/**
 * Decode a SEP-41 `transfer` event. Returns `null` when the event is not a
 * transfer (e.g. `mint`/`burn`).
 */
export function decodeTransferEvent(evt: RawContractEvent): TransferEvent | null {
  const topic = evt.topic;
  if (eventNameFromTopic(topic) !== TRANSFER_EVENT_NAME) return null;

  const fromScv = topic[1];
  const toScv = topic[2];
  if (!fromScv || !toScv) return null;

  return {
    kind: 'transfer',
    from: addressFromScVal(fromScv),
    to: addressFromScVal(toScv),
    amount: amountFromScVal(evt.value),
    ...rawToBase(evt),
  };
}

/** Decode a contract event into a typed event, or `null` if unrecognized. */
export function decodeContractEvent(evt: RawContractEvent): DecodedEvent | null {
  return (
    decodeRetirementEvent(evt) ??
    decodeProjectEvent(evt) ??
    decodeTransferEvent(evt)
  );
}
