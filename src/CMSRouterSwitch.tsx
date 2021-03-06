import React from "react";

import { Redirect, Route, Switch, useLocation } from "react-router-dom";
import "firebase/analytics";
import "firebase/auth";
import "firebase/storage";
import "firebase/firestore";
import { EntityCollection } from "./models";
import { addInitialSlash, buildCollectionPath } from "./routes/navigation";
import { CMSRoute } from "./routes/CMSRoute";
import { AdditionalView } from "./CMSAppProps";
import AdditionalViewRoute from "./routes/AdditionalViewRoute";

export function CMSRouterSwitch({ navigation, additionalViews }: {
    navigation: EntityCollection[],
    additionalViews?: AdditionalView[];
}) {

    const location:any = useLocation();
    const mainLocation = location.state && location.state["main_location"] ? location.state["main_location"] : location;

    const firstCollectionPath = buildCollectionPath(navigation[0]);

    return (
        <Switch location={mainLocation}>

            {navigation.map(entityCollection => (
                    <Route
                        path={buildCollectionPath(entityCollection)}
                        key={`navigation_${entityCollection.relativePath}`}>
                        <CMSRoute
                            type={"collection"}
                            collectionPath={entityCollection.relativePath}
                            view={entityCollection}
                        />
                    </Route>
                )
            )}

            {additionalViews &&
            additionalViews.map(additionalView => (
                <Route
                    key={"additional_view_" + additionalView.path}
                    path={addInitialSlash(additionalView.path)}
                >
                    <AdditionalViewRoute additionalView={additionalView}/>
                </Route>
            ))}

            <Redirect to={firstCollectionPath}/>

        </Switch>
    );
}
