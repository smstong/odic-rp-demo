window.addEventListener("DOMContentLoaded", () => {
    // alias
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    const C = document.createElement.bind(document);

    // data
    const KVS = {
        "issuer": null,
        "authorization_endpoint": null,
        "token_endpoint": null,
        "userinfo_endpoint": null,
        "client_id": null,
        "redirect_uri": null,
        "client_secret": null,
        "response_type": null,
        "response_mode": null,
        "scope": null,
        "state": null,
        "nonce": null,
    };

    // reread UI inputs to update KVS
    const UpdateKVS = () => {
        Object.keys(KVS).forEach((k) => {
            const iE = $('#' + k);
            if (iE) {
                KVS[k] = iE.value.trim();
            }
        });
        UpdateLoginURL();
    };

    // save KVS to localstorage
    const SaveKVS = ()=>{
        Object.keys(KVS).forEach((k)=>{
            localStorage.setItem(k, KVS[k]);
        });
    };

    // read KVS from localstroage
    const LoadKVS = ()=>{
        Object.keys(KVS).forEach((k)=>{
            KVS[k] = localStorage.getItem(k);
        });
        // update UI
        Object.keys(KVS).forEach((k)=>{
            const inputUI = $('#' + k);
            if(inputUI){
                inputUI.value = KVS[k];
            }
        });
    };

    // generate URL encoded query string
    const QS = (...keys) => {
        const q = new URLSearchParams();
        for (const key of keys) {
            q.append(key, KVS[key]);
        }
        return q.toString();
    };


    /////////////////////////////////////////////////// UI ///////////////////////////////////////////
    LoadKVS();
    // OP dicovery
    (() => {
        const updateOP = () => {
            const areaDiscover = $("#areaDiscover");
            const issuer = $("#issuer").value;
            const url = "proxy/" + issuer + "/.well-known/openid-configuration";
            (async () => {
                try {
                    const resp = await fetch(url);
                    const body = await resp.json();
                    areaDiscover.textContent = JSON.stringify(body, null, "    ");
                    $('#authorization_endpoint').value = body["authorization_endpoint"];
                    $('#token_endpoint').value = body["token_endpoint"];
                    $('#userinfo_endpoint').value = body["userinfo_endpoint"];

                    UpdateKVS();

                } catch (e) {
                    areaDiscover.textContent = e;
                }
            })();
        };

        $("#discoverOP").addEventListener("click", () => { updateOP(); });
        updateOP();
    })();

    // deatail OP config checkBox
    (() => {
        const areaDiscoverE = $("#areaDiscover");
        $("#ckShowOP").addEventListener("click", (event) => {
            if (event.target.checked) {
                areaDiscoverE.style.display = "block"
            } else {
                areaDiscoverE.style.display = "none"
            }
        });

    })();

    // update OIDC auth flow
    (() => {
        const inputResponseType = $("#response_type");
        const inputResponseMode = $("#response_mode");
        const oidcFlowE = $("#oidc_flow");
        const setOidcFlow = (response_type) => {
            if (response_type == "code") {
                oidcFlowE.textContent = "authorization code flow";
                inputResponseMode.value = "query";
            } else if (response_type.includes("id_token") && !response_type.includes("code")) {
                oidcFlowE.textContent = "implict flow";
                inputResponseMode.value = "fragment";
            } else if (response_type.includes("code") &&
                (response_type.includes("token") || response_type.includes("id_token"))) {
                oidcFlowE.textContent = "hybrid flow";
                inputResponseMode.value = "fragment";
            } else {
                oidcFlowE.textContent = "unsupported flow";
            }
        }
        setOidcFlow(inputResponseType.value.trim());
        inputResponseType.addEventListener("change", (event) => {
            const response_type = event.target.value.trim();
            setOidcFlow(response_type);
        });
    })();

    // generate login URL
    const UpdateLoginURL = () => {
        const loginURL = KVS['authorization_endpoint'] + "?" +
            QS("client_id", "redirect_uri", "scope", "response_type", "response_mode", "state", "nonce");

        $("#txtLoginURL").textContent = loginURL;
    };

    (() => {
        $$("input").forEach((i) => {
            i.addEventListener("change", () => {
                UpdateKVS();
            });
        });
    })();

    // login button, go to OP
    (() => {
        $("#btnStart").addEventListener("click", () => {
            SaveKVS();
            window.location = $("#txtLoginURL").textContent;
        });
    })();

    // collect callback (code...)
    (() => {
        const u = new URL(document.documentURI);
        const q = u.searchParams;
        const h = new URLSearchParams(u.hash.substring(1));
        h.forEach((v, k) => {
            q.append(k, v);
        });

        console.log(q);
        // this page as login page
        if (q.size == 0){
            return;
        }

        // this page as call back page
        $("#txtCallback").textContent = document.documentURI;

        // for implicit flow
        if(q.get("id_token")){
            $("#txtImplicitToken").textContent = JSON.stringify(JSON.parse(
                atob(q.get("id_token").split(".")[1])
            ), "", "    ");
        }

        const updateGetTokensURL = () => {
            KVS["code"] = q.get("code");
            KVS["grant_type"] = "authorization_code";
            const tokenQ = QS("grant_type", "code", "client_id", "client_secret");
            const getTokensURL = "method: POST\nhost: " + KVS["token_endpoint"] + "\ndata:" + tokenQ.toString();
            $("#txtGetTokensURL").textContent = getTokensURL;
        }
        // for code or hybrid flow
        if (q.get("code")) {
            updateGetTokensURL();
        }

    })();

    // get tokens
    (() => {
        const getTokens = async () => {
            const txtTokensE = $("#txtTokens");
            const urlUserInfoE = $("#txtGetUserInfoURL");
            const q = QS("grant_type", "code", "client_id", "client_secret");
            try {
                const resp = await fetch("proxy/" + KVS["token_endpoint"], {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: q,
                });
                body = await resp.json();
                txtTokensE.textContent = JSON.stringify(body, "", "    ");
                KVS["access_token"] = body["access_token"];
                urlUserInfoE.textContent = "method: GET\n" +
                    "host: " + KVS["userinfo_endpoint"] + "\n" +
                    "Authorization: Bearer " + KVS["access_token"];
                // decode id_token
                const id_token = JSON.parse(atob(body["id_token"].split(".")[1]));
                $("#txtIDToken").textContent = JSON.stringify(id_token, "", "   ");

            } catch (e) {
                txtTokensE.textContent = e;
            }
        };

        $("#btnGetTokens").addEventListener("click", () => {
            getTokens();
        });
    })();

    // get userinfo
    (() => {
        const getUserInfo = async () => {
            const txtUserInfoE = $("#txtUserInfo");
            try {
                const resp = await fetch("proxy/" + KVS["userinfo_endpoint"], {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + KVS["access_token"],
                    },
                });
                body = await resp.json();
                txtUserInfoE.textContent = JSON.stringify(body, "", "    ");
            } catch (e) {
                txtUserInfoE.textContent = e;
            }
        };

        $("#btnGetUserInfo").addEventListener("click", () => {
            getUserInfo();
        });
    })();


    // other
    (() => { })();
});
