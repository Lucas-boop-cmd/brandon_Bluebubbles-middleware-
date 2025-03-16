export declare const IS_READ_ONLY = true;
export declare function transformArguments(): Array<string>;
export interface ClientInfoReply {
    id: number;
    addr: string;
    laddr?: string;
    fd: number;
    name: string;
    age: number;
    idle: number;
    flags: string;
    db: number;
    sub: number;
    psub: number;
    ssub?: number;
    multi: number;
    qbuf: number;
    qbufFree: number;
    argvMem?: number;
    multiMem?: number;
    obl: number;
    oll: number;
    omem: number;
    totMem?: number;
    events: string;
    cmd: string;
    user?: string;
    redir?: number;
    resp?: number;
    libName?: string;
    libVer?: string;
}
export declare function transformReply(rawReply: string): ClientInfoReply;
