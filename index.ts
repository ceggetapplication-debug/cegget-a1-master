import "expo-router/entry";
import "./services/theme/unistyles";
import { useStore } from "@/app/(main)/calculation-logic/store";
import { registerRootComponent } from "expo";
import "@/translations";
import { AppRoot } from "./app/appNavigator";
import "./gesture-handler";

registerRootComponent(AppRoot);
