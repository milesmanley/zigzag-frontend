import React from "react";
import { Translation } from 'react-i18next';
import "../../../translations/i18n";
import "./Footer.css";
import loadingGif from "assets/icons/loading.svg";
import api from "lib/api";

export class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { tab: "orders" };
  }

  setTab(value) {
    this.setState({ tab: value });
  }

  getFills() {
    return Object.values(this.props.userFills).sort((a, b) => b[1] - a[1]);
  }

  getUserOrders() {
    return Object.values(this.props.userOrders)
      .sort((a, b) => b[1] - a[1]);
  }

  renderOrderTable(orders) {
    return (
      <Translation>
        {(t, { i18n }) => (
      <table>
        <thead>
          <tr>
            <th>{t('market')}</th>
            <th>{t('price')}</th>
            <th>{t('quantity')}</th>
            <th>{t('remaining')}</th>
            <th>{t('side')}</th>
            <th>{t('expiry')}</th>
            <th>{t('order_status')}</th>
            <th>{t('action')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => {
            const orderId = order[1];
            const market = order[2];
            let price = order[4];
            let baseQuantity = order[5];
            let remaining = isNaN(Number(order[11])) ? order[5] : order[11];
            const orderStatus = order[9];
            const baseCurrency = order[2].split("-")[0];
            const side = order[3] === "b" ? "buy" : "sell";
            const sideclassname = order[3] === "b" ? "up_value" : "down_value";
            const expiration = order[7];
            const now = Date.now() / 1000 | 0;
            const timeToExpiry = expiration - now;
            let expiryText;
            if (timeToExpiry > 86400) {
                expiryText = Math.floor(timeToExpiry / 86400) + "d";
            }
            else if (timeToExpiry > 3600) {
                expiryText = Math.floor(timeToExpiry / 3600) + "h";
            }
            else if (timeToExpiry > 0) {
                expiryText = Math.floor(timeToExpiry / 3600) + "m";
            }
            else {
                expiryText = "--"
            }

            const orderWithoutFee = api.getOrderDetailsWithoutFee(order);
            if (api.isZksyncChain()) {
              price = orderWithoutFee.price;
              baseQuantity = orderWithoutFee.baseQuantity;
              remaining = orderWithoutFee.remaining;
            }
            let statusText, statusClass;
            switch (order[9]) {
              case "r":
                statusText = <span>{t('rejected')}</span>;
                statusClass = "rejected";
                break;
              case "pf":
                statusText = <span>{t('partial_fill')}</span>;
                statusClass = "filled";
                break;
              case "f":
                statusText = <span>{t('filled')}</span>;
                statusClass = "filled";
                break;
              case "pm":
                statusText = (
                  <span>
                    <span>{t('partial_match')}</span>
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "m":
                statusText = (
                  <span>
                    matched{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "b":
                statusText = (
                  <span>
                    committing{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "committing";
                break;
              case "o":
                statusText = <span>{t('open')}</span>;;
                statusClass = "open";
                break;
              case "c":
                statusText = <span>{t('canceled')}</span>;
                statusClass = "canceled";
                break;
              case "e":
                statusText = <span>{t('expired')}</span>;
                statusClass = "expired";
                break;
              default:
                break
            }

            return (
              <tr key={orderId}>
                <td>{market}</td>
                <td>{price.toPrecision(6) / 1}</td>
                <td>
                  {baseQuantity.toPrecision(6) / 1} {baseCurrency}
                </td>
                <td>
                  {remaining.toPrecision(6) / 1} {baseCurrency}
                </td>
                <td className={sideclassname}>{side}</td>
                <td>{expiryText}</td>
                <td className={statusClass}>{statusText}</td>
                <td>
                  {orderStatus === "o" ? (
                    <span
                      className="cancel_order_link"
                      onClick={() => api.cancelOrder(orderId)}
                    >
                      {t('cancel')}
                    </span>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        )}
      </Translation>
    );
  }

  renderFillTable(fills) {
    let baseExplorerUrl;
    switch (api.apiProvider.network) {
      case 1001:
        baseExplorerUrl = "https://goerli.voyager.online/tx/";
        break;
      case 1000:
        baseExplorerUrl = "https://rinkeby.zkscan.io/explorer/transactions/";
        break;
      case 1:
      default:
        baseExplorerUrl = "https://zkscan.io/explorer/transactions/";
    }
    return (
      <Translation>
        {(t, { i18n }) => (
      <table>
        <thead>
          <tr>
            <th>{t('market')}</th>
            <th>{t('price')}</th>
            <th>{t('quantity')}</th>
            <th>{t('side')}</th>
            <th>{t('fee')}</th>
            <th>{t('order_status')}</th>
            <th>{t('action')}</th>
          </tr>
        </thead>
        <tbody>
          {fills.map((fill, i) => {
            const fillid = fill[1];
            const market = fill[2];
            const side = fill[3];
            let price = fill[4];
            let baseQuantity = fill[5];
            const fillstatus = fill[6];
            const sidetext = fill[3] === "b" ? "buy" : "sell";
            const sideclassname = fill[3] === "b" ? "up_value" : "down_value";
            const txhash = fill[7];
            let feeText;
            feeText = "1 USDC";
            const marketInfo = api.marketInfo[market];
            if (!marketInfo) {
                feeText = "1 USDC";
            }
            else if (fillstatus === "r" || !api.isZksyncChain()) {
              feeText = "0 " + marketInfo.baseAsset.symbol;
            } else if (side === "s") {
              feeText =
                marketInfo.baseFee + " " + marketInfo.baseAsset.symbol;
            } else if (side === "b") {
              feeText =
                marketInfo.quoteFee + " " + marketInfo.quoteAsset.symbol;
            }
            const fillWithoutFee = api.getFillDetailsWithoutFee(fill);
            if (api.isZksyncChain()) {
              price = fillWithoutFee.price;
              baseQuantity = fillWithoutFee.baseQuantity;
            }
            let statusText, statusClass;
            switch (fillstatus) {
              case "r":
                statusText = <span>{t('rejected')}</span>
                statusClass = "rejected";
                break;
              case "pf":
                statusText = <span>{t('partial_fill')}</span>;
                statusClass = "filled";
                break;
              case "f":
                statusText = <span>{t('filled')}</span>;
                statusClass = "filled";
                break;
              case "pm":
                statusText = (
                  <span>
                    {t('partial_match')}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "m":
                statusText = (
                  <span>
                    {t('matched')}{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "matched";
                break;
              case "b":
                statusText = (
                  <span>
                    committing{" "}
                    <img
                      className="loading-gif"
                      src={loadingGif}
                      alt="Pending"
                    />
                  </span>
                );
                statusClass = "committing";
                break;
              case "o":
                statusText = <span>{t('open')}</span>;
                statusClass = "open";
                break;
              case "c":
                statusText = <span>{t('canceled')}</span>;
                statusClass = "canceled";
                break;
              case "e":
                statusText = <span>{t('expired')}</span>;
                statusClass = "expired";
                break;
              default:
                break;
            }

          return (
            <tr key={fillid}>
              <td>{market}</td>
              <td>{price.toPrecision(6) / 1}</td>
              <td>
                {baseQuantity.toPrecision(6) / 1} {marketInfo && marketInfo.baseAsset.symbol}
              </td>
              <td className={sideclassname}>{sidetext}</td>
              <td>{feeText}</td>
              <td className={statusClass}>{statusText}</td>
              <td>
                {txhash ? (
                  <a
                    href={baseExplorerUrl + txhash}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('view_tx')}
                  </a>
                ) : (
                  ""
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  )}
</Translation>
    );
  }

  render() {
    let explorerLink;
    switch (api.apiProvider.network) {
      case 1000:
        explorerLink =
          "https://rinkeby.zkscan.io/explorer/accounts/" +
          this.props.user.address;
        break;
      case 1:
      default:
        explorerLink =
          "https://zkscan.io/explorer/accounts/" + this.props.user.address;
    }
    let footerContent,
      classNameOrders = "",
      classNameBalances = "",
      classNameFills = "";
    switch (this.state.tab) {
      case "orders":
        footerContent = this.renderOrderTable(this.getUserOrders());
        classNameOrders = "selected";
        break;
      case "fills":
        footerContent = this.renderFillTable(this.getFills());
        classNameFills = "selected";
        break;
      case "balances":
        if (this.props.user.committed) {
          const balancesContent = Object.keys(
            this.props.user.committed.balances
          ).sort().map((token) => {
            const currencyInfo = api.getCurrencyInfo(token);
            if (!currencyInfo) return "";
            let balance = this.props.user.committed.balances[token];
            balance =
              parseInt(balance) / Math.pow(10, currencyInfo.decimals);
            return (
              <tr>
                <td>{token}</td>
                <td>{balance}</td>
              </tr>
            );
          });
          footerContent = (
            <Translation>
            {(t, { i18n }) => (
            <div>
              <table className="balances_table">
                <thead>
                  <tr>
                    <th>{t('token')}</th>
                    <th>{t('balance')}</th>
                  </tr>
                </thead>
                <tbody>{balancesContent}</tbody>
              </table>

              <a href={explorerLink} target="_blank" rel="noreferrer">
                {t('view_on_explorer')}
              </a>
            </div>
             )}
        </Translation>
          );
        } else {
          footerContent = (
            <Translation>
            {(t, { i18n }) => (
            <div>
              <a href={explorerLink} target="_blank" rel="noreferrer">
                {t('view_on_explorer')}
              </a>
            </div>
            )}
            </Translation>
          );
        }
        classNameBalances = "selected";
        break;
      default:
        break;
    }

    return (
      <Translation>
        {(t, { i18n }) => (
      <>
        <div className="footer">
          <div className="footer_container">
            <hr />
            <div>
              <div className="ft_tabs">
                <strong
                  className={classNameOrders}
                  onClick={() => this.setTab("orders")}
                >
                  {t('orders')} ({this.getUserOrders().length})
                </strong>
                <strong
                  className={classNameFills}
                  onClick={() => this.setTab("fills")}
                >
                  {t('fills')} ({this.getFills().length})
                </strong>
                <strong
                  className={classNameBalances}
                  onClick={() => this.setTab("balances")}
                >
                  {t('balances')}
                </strong>
              </div>
            </div>
            <div className="footer_orders">{footerContent}</div>
          </div>
        </div>
      </>
      )}
      </Translation>
    );
  }
}
