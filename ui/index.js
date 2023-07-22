window.addEventListener("DOMContentLoaded", () => {
    // OP dicovery
    (() => {
        const areaDiscover = document.querySelector("#areaDiscover");
        const authEP_E = document.querySelector('#authorization_endpoint');
        const tokenEP_E = document.querySelector('#token_endpoint');
        const userinfoEP_E = document.querySelector('#userinfo_endpoint');
        const btnDiscoverOP = document.querySelector("#discoverOP");
        const issuer = document.querySelector("#issuer").value;
        const updateOP = () => {
            const url =  "proxy/" + issuer + "/.well-known/openid-configuration";
            (async () => {
                try {
                    const resp = await fetch(url);
                    const body = await resp.json();
                    areaDiscover.textContent = JSON.stringify(body, null, "    ");
                    authEP_E.value = body["authorization_endpoint"];
                    tokenEP_E.value = body["token_endpoint"];
                    userinfoEP_E.value = body["userinfo_endpoint"];
                    userinfoEP_E.dispatchEvent(new Event("change"));
                    UpdateKVS();
                } catch (e) {
                    areaDiscover.textContent = e;
                    console.log(e);
                }
            })();
        };
        btnDiscoverOP.addEventListener("click", ()=>{ updateOP(); });
        updateOP();
    })();

    // checkBox
    (()=>{
        const areaDiscoverE = document.querySelector("#areaDiscover");
        const ckBoxE = document.querySelector("#ckShowOP");
        if(ckBoxE == null || areaDiscoverE == null){
            console.log("ckBoxE or areaDiscover is null");
            return;
        }
        ckBoxE.addEventListener("click", (event)=>{
            if(event.target.checked){
                areaDiscoverE.style.display = "block"
            }else{
                areaDiscoverE.style.display = "none"
            }
        });

    })();

    // update OIDC auth flow
    (() => {
        const inputResponseType = document.querySelector("#response_type");
        const inputResponseMode = document.querySelector("#response_mode");
        const oidcFlowE = document.querySelector("#oidc_flow");
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

    // global data set
    const KVS = {
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
    const QS = (...keys) => {
        const q = new URLSearchParams();
        for (const key of keys) {
            q.append(key, KVS[key]);
        }
        return q.toString();
    };
    const UpdateKVS = ()=>{
            Object.keys(KVS).forEach((k) => {
                const iE = document.querySelector(`#${k}`);
                if(iE){
                    KVS[k] = iE.value.trim();
                }

            });
        }
    // update login URL
    (() => {
        const updateLoginURL = () => {
            UpdateKVS();
            console.log(KVS);
            // generate login URL 
            let loginURL = KVS['authorization_endpoint'] + "?" +
                QS("client_id", "redirect_uri", "scope", "response_type", "response_mode", "state", "nonce");

            const txtLoginURLE = document.querySelector("#txtLoginURL");
            txtLoginURLE.textContent = loginURL;
        };

        const inputs = document.querySelectorAll("input");
        inputs.forEach((i) => {
            i.addEventListener("change", () => {
                updateLoginURL();
            });
        });
    })();

    // login button
    (() => {
        document.querySelector("#btnStart").addEventListener("click", () => {
            window.location = document.querySelector("#txtLoginURL").textContent;
        });
    })();

    // collect callback (code...)
    (() => {
        document.querySelector("#txtCallback").textContent = document.documentURI;
        const u = new URL(document.documentURI);
        const q = u.searchParams;
        const h = new URLSearchParams(u.hash.substring(1));
        h.forEach((v, k) => {
            q.append(k, v);
        });
        console.log(q);

        if(q.get("code") == null){
            console.log("code is null");
            return;
        }

        const inputs = document.querySelectorAll("input");
        inputs.forEach((i) => {
            i.addEventListener("change", () => {
                updateGetTokensURL();
            });
        });

        const updateGetTokensURL = () => {
            KVS["code"] = q.get("code");
            KVS["grant_type"] = "authorization_code";
            const tokenQ = QS("grant_type", "code", "client_id", "client_secret");
            const getTokensURL = "method: POST\nhost: " + KVS["token_endpoint"] + "\ndata:" + tokenQ.toString();
            document.querySelector("#txtGetTokensURL").textContent = getTokensURL;
        }
    })();

    // get tokens
    (() => {
        const getTokens = async () => {
            const txtTokensE = document.querySelector("#txtTokens");
            const urlUserInfoE = document.querySelector("#txtGetUserInfoURL");
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
                document.querySelector("#txtIDToken").textContent = JSON.stringify(id_token, "", "   ");
                
            } catch (e) {
                txtTokensE.textContent = e;
            }
        };

        document.querySelector("#btnGetTokens").addEventListener("click", () => {
            getTokens();
        });
    })();

    // get userinfo
    (() => {
        const getUserInfo = async () => {
            const txtUserInfoE = document.querySelector("#txtUserInfo");
            try {
                const resp = await fetch("proxy/" + KVS["userinfo_endpoint"], {
                    method: "GET",
                    headers:{
                        "Authorization": "Bearer " + KVS["access_token"],
                    },
                });
                body = await resp.json();
                txtUserInfoE.textContent = JSON.stringify(body, "", "    ");
            } catch (e) {
                txtUserInfoE.textContent = e;
            }
        };

        document.querySelector("#btnGetUserInfo").addEventListener("click", () => {
            getUserInfo();
        });
    })();


    // other
    (() => { })();
});
