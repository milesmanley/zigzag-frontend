import React, {useState} from "react";
import { useTranslation } from "react-i18next";
import "../../../translations/i18n";
import RadioButtons from "./RadioButtons";
import {x} from "@xstyled/styled-components"
import {Button} from "../Form/Submit";

const RadioButtonsDemo = () => {
  const [value, setValue] = useState("three")
  const { t } = useTranslation();

  return <x.div>
    <x.div>
      <RadioButtons
        name={"uncontrolledRadios"}
        items={[{id: "one", name: "one"}, {id: "two", name: "two"}]}
      />
    </x.div>
    <x.div row>
      <x.div col>
        <RadioButtons
          horizontal
          name={"controlledRadio"}
          items={[{id: "three", name: "three"}, {id: "four", name: "four"}]}
          value={value}
          onChange={setValue}
        />
      </x.div>
      <x.div col>
        <Button variant={"secondary"} onClick={() => setValue(value === "three" ? "four" : "three")}>{t("change_controlled")}</Button>
      </x.div>
    </x.div>
  </x.div>
}

export default RadioButtonsDemo
