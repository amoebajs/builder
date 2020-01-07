import { InjectScope } from "@bonbons/di";
import { Injectable } from "../../core/decorators";

@Injectable(InjectScope.Singleton)
export class BasicHelper {}
