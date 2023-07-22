FROM scratch
COPY oidc-client /oidc-client
ENTRYPOINT [ "/oidc-client" ]
CMD ["-h"]