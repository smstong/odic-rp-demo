FROM alpine
COPY debug/oidc-client /app/
ENTRYPOINT [ "/app/oidc-client" ]
CMD ["-h"]