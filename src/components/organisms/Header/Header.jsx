import { useSelector } from 'react-redux'
import { BiChevronDown } from 'react-icons/bi'
import { FaDiscord, FaTelegramPlane, FaTwitter } from 'react-icons/fa'
import { GoGlobe } from 'react-icons/go'
import { HiExternalLink } from 'react-icons/hi'
import React, { useState } from 'react'
import { useTranslation } from "react-i18next";
import "../../../translations/i18n";
import { NavLink } from 'react-router-dom'
import { Dropdown, AccountDropdown, Menu, MenuItem } from 'components'
import { userSelector } from 'lib/store/features/auth/authSlice'
import { networkSelector } from 'lib/store/features/api/apiSlice'
import api from 'lib/api'
import logo from 'assets/images/logo.png'
import menu from 'assets/icons/menu.png'
import './Header.css'
import ConnectWalletButton from "../../atoms/ConnectWalletButton/ConnectWalletButton";
import {Dev } from "../../../lib/helpers/env";

export const Header = (props) => {
  // state to open or close the sidebar in mobile
  const [show, setShow] = useState(false)
  const user = useSelector(userSelector)
  const network = useSelector(networkSelector)
  const hasBridge = api.isImplemented('depositL2')
  const { t } = useTranslation();

  const handleMenu = ({ key }) => {
    switch (key) {
      case 'signOut':
        api.signOut()
        return
      default:
        throw new Error('Invalid dropdown option')
    }
  }

  const dropdownMenu = (
    <Menu onSelect={handleMenu}>
      <MenuItem key="signOut">Disconnect</MenuItem>
    </Menu>
  )

  return (
    <>
      <header>
        <div className="mobile_header mb_h">
          <img src={logo} alt="logo" />
          {/* open sidebar function */}
          <img
            onClick={() => {
              setShow(!show)
            }}
            src={menu}
            alt="..."
          />
        </div>
        {/* mobile sidebar */}
        {show ? (
          <div className="mb_header_container mb_h">
            <img src={logo} alt="logo" />
            <div className="head_left">
              <ul>
                <li>
                  <NavLink exact to="/" activeClassName="active_link">
                    {t("trade")}
                  </NavLink>
                </li>
                {hasBridge && <li>
                  <NavLink exact to="/bridge" activeClassName="active_link">
                    {t("bridge")}
                  </NavLink>
                </li>}
                {hasBridge && <li>
                  <a href="https://docs.zigzag.exchange/" target="_blank" rel="noreferrer">
                    {t("docs")}
                    {' '}<HiExternalLink />
                  </a>
                </li>}
                <li>
                  <NavLink exact to="/list-pair" activeClassName="active_link">
                    {t("list")}
                  </NavLink>
                </li>
                <Dev>
                  <li>
                    <NavLink exact to="/pool" activeClassName="active_link">
                      {t("trade")}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink exact to="/dsl" activeClassName="active-link">
                      {t("dsl")}
                    </NavLink>
                  </li>
                </Dev>
              </ul>
            </div>
            <div className="head_right">
              <div className="d-flex align-items-center justify-content-between">
                {user.id && user.address ? (
                  <Dropdown overlay={dropdownMenu}>
                    <button className="address_button">
                      {user.address.slice(0, 6)}...
                      {user.address.slice(-4)}
                    </button>
                  </Dropdown>
                ) : (
                  <ConnectWalletButton/>
                )}
              </div>
              <div className="eu_text">
                <GoGlobe className="eu_network" />
                <select
                  value={network.toString()}
                  onChange={(e) => {
                    api.setAPIProvider(parseInt(e.target.value))
                    api.refreshNetwork().catch(err => {
                      console.log(err)
                    })
                  }}
                >
                  <option value="1">zkSync - Mainnet</option>
                  <option value="1000">zkSync - Rinkeby</option>
                </select>
                <BiChevronDown className="eu_caret" />
              </div>
            </div>
          </div>
        ) : null}

        {/* desktop header */}
        <div className="head_wrapper_desktop dex_h">
          <div className="head_left">
            <a href="http://info.zigzag.exchange" rel="noreferrer"><img src={logo} alt="logo" /></a>
            <ul>
              <li>
                <NavLink exact to="/" activeClassName="active_link">
                  {t("trade")}
                </NavLink>
              </li>
              {hasBridge && <li>
                <NavLink exact to="/bridge" activeClassName="active_link">
                  {t("bridge")}
                </NavLink>
              </li>}
              <li>
                <NavLink exact to="/list-pair" activeClassName="active_link">
                  {t("list")}
                </NavLink>
              </li>
              {hasBridge && <li>
                <a href="https://docs.zigzag.exchange/" target="_blank" rel="noreferrer">
                  {t("docs")}
                  {' '}<HiExternalLink />
                </a>
              </li>}
              <Dev>
                <li>
                  <NavLink exact to="/pool" activeClassName="active_link">
                    {t("pool")}
                  </NavLink>
                </li>
                <li>
                  <NavLink exact to="/dsl" activeClassName="active_link">
                    {t("dsl")}
                  </NavLink>
                </li>
              </Dev>
            </ul>
          </div>
          <div className="head_left head_left_socials">
          <ul>
            <li className="head_social_link">
              <a target="_blank" rel="noreferrer" href="https://discord.gg/zigzag"><FaDiscord /></a>
            </li>
            <li className="head_social_link"> 
              <a target="_blank" rel="noreferrer" href="https://twitter.com/ZigZagExchange"><FaTwitter /></a>
            </li>  
            <li className="head_social_link">
              <a target="_blank" rel="noreferrer" href="https://t.me/zigzagexchange"><FaTelegramPlane /></a> 
            </li>  
            </ul>
                  
                </div>
          <div className="head_right">
            <label htmlFor="networkSelector" className="eu_text">
                <GoGlobe className="eu_network" />
                <select
                  id="networkSelector"
                  value={network.toString()}
                  onChange={(e) => {
                    api.setAPIProvider(parseInt(e.target.value))
                    api.refreshNetwork().catch(err => {
                      console.log(err)
                    })
                  }}
                >
                  <option value="1">zkSync - Mainnet</option>
                  <option value="1000">zkSync - Rinkeby</option>
                </select>
                <BiChevronDown className="eu_caret" />
              </label>
            <div className="head_account_area">
              {user.id && user.address ? (
                <AccountDropdown/>
              ) : (
                <ConnectWalletButton/>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
