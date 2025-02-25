import React, {useState, useEffect} from "react";
import { useTranslation } from "react-i18next";
import "../../../translations/i18n";
import {useSelector} from 'react-redux';
import {userSelector} from "lib/store/features/auth/authSlice";
import api from 'lib/api';
import {DefaultTemplate} from 'components';
import {RiErrorWarningLine} from "react-icons/all";
import 'bootstrap'
import ConnectWalletButton from "../../atoms/ConnectWalletButton/ConnectWalletButton";
import Pane from "../../atoms/Pane/Pane";
import AllocationModal from "./AllocationModal";
import {x} from "@xstyled/styled-components"
import Submit, {Button} from "../../atoms/Form/Submit";
import {jsonify} from "../../../lib/helpers/strings";
import {Dev} from "../../../lib/helpers/env";
import SuccessModal from "./SuccessModal";
import {arweaveAllocationSelector, networkSelector} from "lib/store/features/api/apiSlice";
import {sleep} from "../../../lib/helpers/utils";
import {HiExternalLink} from "react-icons/hi";
import ExternalLink from "./ExternalLink";
import ListPairForm from "./ListPairForm";

export const TRADING_VIEW_CHART_KEY = "tradingViewChart"


export default function ListPairPage() {
  const user = useSelector(userSelector);
  const isUserLoggedIn = user.id !== null && user.id !== undefined

  const arweaveAllocation = useSelector(arweaveAllocationSelector);
  const arweaveAllocationKB = Number(arweaveAllocation) / 1000
  const [isArweaveAllocationSufficient, setIsArweaveAllocationSufficient] = useState(false)

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const [txid, setTxId] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null)
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

  const network = useSelector(networkSelector);
  const isUserConnectedToMainnet = network === 1

  // we purchase 500k bytes at once so the user does not have to
  // repeatedly repurchase space if wanting to list more than 1 market
  const bytesToPurchase = 500000
  const { t } = useTranslation();
  const refreshUserArweaveAllocation = () => {
    return api.refreshArweaveAllocation(user.address)
  }


  const onFormSubmit = async (formData, resetForm) => {
    return new Promise(async (resolve, reject) => {
      const toFile = {}
      for (const [key] of Object.entries(formData)) {
        if (key === TRADING_VIEW_CHART_KEY) {
          if (formData[key] !== "") {
            toFile[key] = formData[key]
          }
        } else {
          toFile[key] = Number(formData[key])
        }
      }
      const fileData = new TextEncoder().encode(jsonify(toFile))
      const file = new File([fileData], `${toFile.baseAssetId}-${toFile.quoteAssetId}.json`)

      if (file.size > arweaveAllocation) {
        setFileToUpload(file)
        setIsAllocationModalOpen(true)
        setHasAttemptedSubmit(true)
        reject()
        return
      }

      const timestamp = Date.now();
      const message = `${user.address}:${timestamp}`;
      try {
        const signature = await api.signMessage(message);
        const response = await api.uploadArweaveFile(user.address, timestamp, signature, file);
        setTxId(response.arweave_txid);

        setIsSuccessModalOpen(true);
        setHasAttemptedSubmit(false)
        resetForm()
      } catch (e) {
        reject(e)
        return
      }
      refreshUserArweaveAllocation();
      resolve()
    })
  }

  useEffect(() => {
    refreshUserArweaveAllocation()
    setHasAttemptedSubmit(false)
  }, [user.address])

  useEffect(() => {
    if (fileToUpload) {
      if (fileToUpload.size <= arweaveAllocation) {
        setIsArweaveAllocationSufficient(true)
      } else {
        setIsArweaveAllocationSufficient(false)
      }
    }
  }, [arweaveAllocation])

  return (
    <DefaultTemplate>
      <x.div p={4}
             backgroundColor={"blue-400"}
             w={"full"}
             h={"full"}
             style={{minHeight: "calc(100vh - 80px)"}}
             color={"white"}
             display={"flex"}
             alignItems={"center"}
             justifyContent={"center"}
      >
        <Pane size={"sm"} variant={"light"} maxWidth={"500px"} margin={"auto"}>
          <x.div display={"flex"} justifyContent={"space-between"} mb={4}>
            <x.div fontSize={28} mb={2}>{t("list_new_market")}</x.div>
            <x.div fontSize={12} color={"blue-gray-400"} textAlign={"center"}>
              <x.div>{t("no_internal_id")}</x.div>
              <x.div>
                <ExternalLink href={"https://zkscan.io/explorer/tokens"}>
                  {t("list_your_token")} <HiExternalLink />
                </ExternalLink>
              </x.div>
            </x.div>
          </x.div>

          <ListPairForm onSubmit={onFormSubmit}>
            {(fileToUpload && !isArweaveAllocationSufficient) &&
            <x.div display={"flex"} alignItems={"center"} justifyContent={"space-between"} mb={4}>
              <x.div display={"flex"} alignItems={"center"}>
                <RiErrorWarningLine size={18} color={"red"}/>
                <x.div ml={1} fontSize={12} color={"blue-gray-400"}>{t("insufficient_arweave_allocation")}</x.div>
              </x.div>
              <x.div color={"blue-gray-400"}>
                {arweaveAllocationKB} {t("kb")}
              </x.div>
            </x.div>}

            <Dev>
              <x.div fontSize={12} color={"blue-gray-500"} mb={3} textAlign={"right"}>
                {t("arweave_allocation")} {arweaveAllocationKB} {t("kb")}
              </x.div>
            </Dev>

            {(() => {
              if (!isUserLoggedIn) {
                return <ConnectWalletButton/>
              } else {
                if (isUserConnectedToMainnet) {
                  return <Submit block mt={5}>
                    {!isArweaveAllocationSufficient && hasAttemptedSubmit ? t("purchase_allocation_c") : t("list_c")}
                  </Submit>
                } else {
                  return <Button block isDisabled>{t("please_connect_to_mainnet")}</Button>
                }
              }
            })()}
          </ListPairForm>
        </Pane>
      </x.div>
      <AllocationModal
        onClose={() => setIsAllocationModalOpen(false)}
        show={isAllocationModalOpen}
        bytesToPurchase={bytesToPurchase}
        onSuccess={async () => {
          // API cache needs a bit of time to update. Arweave bridge runs on a 5 second loop
          // we timeout here so we make sure we get fresh data
          await sleep(5000)
          await refreshUserArweaveAllocation()
          setFileToUpload(null)
          setIsAllocationModalOpen(false)
        }}
      />
      <SuccessModal
        txid={txid}
        show={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setTxId(null);
        }}
      />
    </DefaultTemplate>
  )
}
