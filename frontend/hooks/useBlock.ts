"use client"

import { useBlockNumber } from "wagmi"

/** Single shared block subscription for the entire app. */
export function useBlock() {
  return useBlockNumber({ watch: true })
}
