import React, {useCallback, useEffect, useState} from "react";
import { Translation } from "react-i18next";
import "../../../translations/i18n";
import {x} from "@xstyled/styled-components"
import NumberInput from "../../atoms/Form/NumberInput";
import {model} from "../../atoms/Form/helpers";
import {forceValidation, max, min, required} from "../../atoms/Form/validation";
import SelectInput from "../../atoms/Form/SelectInput";
import {Button} from "../../atoms/Form/Submit";
import TextInput from "../../atoms/Form/TextInput";
import {AiOutlineQuestionCircle} from "react-icons/all";
import Form from "../../atoms/Form/Form";
import {TRADING_VIEW_CHART_KEY} from "./ListPairPage";
import api from "../../../lib/api";
import Tooltip from "../../atoms/Tooltip/Tooltip";
import {debounce} from "lodash";

const getAmountForTargetNotional = (price) => {
  const targetUSDFeeAmount = 1
  return (targetUSDFeeAmount / price).toFixed(6)
}
const renderFeeHint = (assetPrice, assetFee, symbol, feeSetter) => {
  if (assetPrice) {
    const notional = (Number(assetPrice) * Number(assetFee)).toFixed(2)
    if (notional > 0) {
      return <x.div pl={2} fontSize={12} color={"blue-gray-500"} mt={1} display={"flex"} alignItems={"center"} justifyContent={"space-between"}>
        <x.div style={{wordBreak: "break-all"}}>
          {assetFee} {symbol} = ${notional}
        </x.div>
        {notional > 1 && <x.div>
        <Translation>
            {(t, { i18n }) => (
          <Button
            ml={1}
            variant={"secondary"}
            size={"xs"}
            onClick={() => feeSetter(getAmountForTargetNotional(assetPrice))}>
            {t("file_size")}
          </Button>
          )}
      </Translation>
          <x.div/>
        </x.div>}
      </x.div>}

  }
  return null
}


const ListPairForm = ({
  onSubmit,
  children
}) => {
  const [baseAssetId, setBaseAssetId] = useState("")
  const [quoteAssetId, setQuoteAssetId] = useState("")
  const [baseFee, setBaseFee] = useState("")
  const [quoteFee, setQuoteFee] = useState("")
  const [basePrice, setBasePrice] = useState(null)
  const [quotePrice, setQuotePrice] = useState(null)
  const [baseSymbol, setBaseSymbol] = useState(null)
  const [quoteSymbol, setQuoteSymbol] = useState(null)
  const [isBaseAssetIdInvalid, setIsBaseAssetIdInvalid] = useState(false)
  const [isQuoteAssetIdInvalid, setIsQuoteAssetIdInvalid] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [zigZagChainId, setZigZagChainId] = useState(1)

  const getTokenInfo = async (assetId, chainId, priceSetter, feeSetter, symbolSetter, isInvalidSetter) => {
    if (assetId && assetId !== "") {
      try {
        const {symbol} = await api.getTokenInfo(assetId, chainId)
        if (symbol) {
          symbolSetter(symbol)
          isInvalidSetter(false)

          try {
            const {price: apiPrice}  = await api.getTokenPrice(assetId, chainId)
            const price = Number(apiPrice)
            if (price === 0) {
              throw Error(`${symbol} price came back as 0`)
            }
            priceSetter(price)
            feeSetter(getAmountForTargetNotional(price))
          } catch (e) {
            feeSetter("")
            priceSetter(null)
          }
        }
      } catch (e) {
        symbolSetter(null)
        isInvalidSetter(true)
        feeSetter("")
        priceSetter(null)
      }
    } else {
      symbolSetter(null)
      priceSetter(null)
    }
  }

  const getBaseInfo = (assetId, zigzagId) => getTokenInfo(assetId, zigzagId, setBasePrice, setBaseFee, setBaseSymbol, setIsBaseAssetIdInvalid)
  const queryBaseTokenInfo = useCallback(debounce(getBaseInfo, 500), [])
  useEffect(() => {
    queryBaseTokenInfo(baseAssetId, zigZagChainId)
  }, [baseAssetId, zigZagChainId])

  const getQuoteInfo = (assetId, zigzagId) => getTokenInfo(assetId, zigzagId, setQuotePrice, setQuoteFee, setQuoteSymbol, setIsQuoteAssetIdInvalid)
  const queryQuoteTokenInfo = useCallback(debounce(getQuoteInfo, 500), [])
  useEffect(() => {
    queryQuoteTokenInfo(quoteAssetId, zigZagChainId)
  }, [quoteAssetId, zigZagChainId])

  return <x.div>

    <PairPreview
      baseAssetId={baseAssetId}
      quoteAssetId={quoteAssetId}
      baseSymbol={baseSymbol}
      quoteSymbol={quoteSymbol}
    />
    <Form
      initialValues={{
        baseAssetId: baseAssetId,
        quoteAssetId: quoteAssetId,
        baseFee: baseFee,
        quoteFee: quoteFee,
        zigzagChainId: zigZagChainId,
        pricePrecisionDecimals: "",
        [TRADING_VIEW_CHART_KEY]: ""
      }}
      onSubmit={onSubmit}
    >
      <Translation>
      {(t, { i18n }) => (
      <x.div display={"grid"} gridTemplateColumns={2} rowGap={5} columnGap={6} mb={5}>
        <NumberInput
          block
          {...model(baseAssetId, setBaseAssetId)}
          label={<x.span>{t('base_asset')}<x.a color={{_: "blue-gray-500", hover: "teal-200"}} target={"_blank"} href={zigZagChainId === 1 ? "https://zkscan.io/explorer/tokens" : "https://rinkeby.zkscan.io/explorer/tokens"}>{t('internal_id')}</x.a></x.span>}
          name={"baseAssetId"}
          validate={[
            required,
            min(0),
            forceValidation(isBaseAssetIdInvalid, "invalid asset on zksync")
          ]}
          rightOfLabel={<TooltipHelper>{t('zksync_token_id_of_the_first')} (BASE/QUOTE)</TooltipHelper>}
        />
        <NumberInput
          block
          {...model(quoteAssetId, setQuoteAssetId)}
          label={<x.span>{t('quote_asset')} <x.a color={{_: "blue-gray-500", hover: "teal-200"}} target={"_blank"} href={zigZagChainId === 1 ? "https://zkscan.io/explorer/tokens" : "https://rinkeby.zkscan.io/explorer/tokens"}>{t('internal_id')}</x.a></x.span>}
          name={"quoteAssetId"}
          validate={[
            required,
            min(0),
            forceValidation(isQuoteAssetIdInvalid, "invalid asset on zksync")
          ]}
          rightOfLabel={<TooltipHelper>{t('zk_sync_token_id_of_the_second')} (BASE/QUOTE)</TooltipHelper>}
        />
        <x.div display={"flex"} flexDirection={"column"}>
          <NumberInput
            block
            name={"baseFee"}
            {...model(baseFee, setBaseFee)}
            label={baseSymbol ? `${baseSymbol} Swap Fee` : t('base_swap_fee')}
            validate={[required, min(0)]}
            rightOfLabel={<TooltipHelper>{t('swap_fee_collected_by_market_makers')}</TooltipHelper>}
          />
          {renderFeeHint(basePrice, baseFee, baseSymbol, setBaseFee)}
        </x.div>
        <x.div display={"flex"} flexDirection={"column"}>
          <NumberInput
            block
            name={"quoteFee"}
            {...model(quoteFee, setQuoteFee)}
            label={quoteSymbol ? `${quoteSymbol} Swap Fee` : t('quote_swap_fee')}
            validate={[required, min(0)]}
            rightOfLabel={<TooltipHelper>{t('swap_fee_collected_by_market_makers')}</TooltipHelper>}
          />
          {renderFeeHint(quotePrice, quoteFee, quoteSymbol, setQuoteFee)}
        </x.div>
        <NumberInput
          block
          name={"pricePrecisionDecimals"}
          label={"Price Precision Decimals"}
          validate={[required, max(10), min(0)]}
          rightOfLabel={<TooltipHelper>
            <x.div>
              {t('number_of_decimals')}
            </x.div>

            <x.div display={"grid"} gridTemplateColumns={2} mt={2} gap={0}>
              <x.div>ex: ETH/USDC has '2'</x.div>
              <x.div>($3250.61)</x.div>
              <x.div>ex: ETH/WBTC has '6'</x.div>
              <x.div>(0.075225)</x.div>
            </x.div>
          </TooltipHelper>}
        />
        <SelectInput
          {...model(zigZagChainId, setZigZagChainId)}
          name={"zigzagChainId"}
          label={"Network"}
          items={[{name: "zkSync - Mainnet", id: 1}, {name: "zkSync - Rinkeby", id: 1000}]}
          validate={required}
          rightOfLabel={<TooltipHelper>{t('zksync_network_on_which_pair_will_be_listed')}</TooltipHelper>}
        />
      </x.div>
          )}
        </Translation>

      <Translation>
      {(t, { i18n }) => (
      <x.div mb={4}>
        <x.div display={"flex"} alignItems={"center"} justifyContent={"flex-end"}>
          <x.div fontSize={12} mr={2} color={"blue-gray-400"}>{t('advanced_settings')}</x.div>
          <Button
            size={"xs"}
            variant={"secondary"}
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}>{showAdvancedSettings ? "-" : "+"}</Button>
        </x.div>
        {showAdvancedSettings && <>
          <x.div h={"2px"} w={"full"} bg={"blue-gray-800"} borderRadius={10} my={4}/>
          <x.div display={"grid"} gridTemplateColumns={2} columnGap={6}>
            <TextInput
              block
              name={TRADING_VIEW_CHART_KEY}
              label={t('default_chart_ticker')}
              rightOfLabel={<TooltipHelper>
                <x.div>
                  {t('default_tradingview_chart_on_tradepage')}
                </x.div>
                <x.div mt={2}>
                  (ex: show COINBASE:BTCUSD for WBTC-USD)
                </x.div>
              </TooltipHelper>}
            />
          </x.div>
        </>}
      </x.div>
      )}
        </Translation>
      {children}
    </Form>
  </x.div>
}

const PairPreview = ({
  baseAssetId,
  quoteAssetId,
  baseSymbol,
  quoteSymbol
}) => {
  return <>
    {(baseAssetId || quoteAssetId) &&
    <x.div display={"flex"} fontSize={35} justifyContent={"center"} my={4}>
      <x.span color={baseSymbol ? "blue-gray-400" : "blue-gray-800"}>
        {baseSymbol ? baseSymbol : "XXX"}
      </x.span>
      <x.span color={baseSymbol && quoteSymbol ? "blue-gray-400" : "blue-gray-800"}>/</x.span>
      <x.span color={quoteSymbol ? "blue-gray-400" : "blue-gray-800"}>
        {quoteSymbol ? quoteSymbol : "XXX"}
      </x.span>
    </x.div>}
  </>
}

const TooltipHelper = ({children}) => {
  return <Tooltip placement={"right"} label={children}>
    <x.div display={"inline-flex"} color={"blue-gray-600"} ml={2} alignItems={"center"}>
      <AiOutlineQuestionCircle size={14}/>
    </x.div>
  </Tooltip>
}

export default ListPairForm
