FROM node:10.15.3-alpine as dependencies
WORKDIR /opt/app

COPY ./package.json /opt/app/package.json
COPY ./yarn.lock /opt/app/yarn.lock
RUN yarn install --production
RUN cp -R node_modules prod_node_modules
RUN yarn

FROM dependencies as dev
COPY ./ /opt/app
ENTRYPOINT ["yarn", "dev"]

FROM dependencies as test
COPY ./ /opt/app
RUN yarn test && yarn lint && yarn audit

FROM dependencies as build
COPY ./ /opt/app
RUN yarn build

FROM node:10.15.3-alpine as release

ENV user node
WORKDIR /opt/app

COPY --from=dependencies /opt/app/prod_node_modules /opt/app/node_modules
COPY --from=build /opt/app/dist /opt/app/dist
COPY ./package.json /opt/app/package.json
COPY ./.env.* /opt/app/

RUN chown $user -R /opt/app
USER $user

EXPOSE 5000
ENTRYPOINT ["yarn", "start"]