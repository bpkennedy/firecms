import {
    debounce,
    FormControlState,
    useForkRef,
    useFormControl
} from "@material-ui/core";
import * as React from "react";

function getStyleValue(computedStyle: any, property: any) {
    return parseInt(computedStyle[property], 10) || 0;
}

const useEnhancedEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const styles = {
    /* Styles applied to the shadow textarea element. */
    shadow: {
        // Visibility needed to hide the extra text area on iPads
        visibility: "hidden",
        // Remove from the content flow
        position: "absolute",
        // Ignore the scrollbar width
        overflow: "hidden",
        height: 0,
        top: 0,
        left: 0,
        // Create a new layer, increase the isolation of the computed values
        transform: "translateZ(0)"
    }
};

const TextareaAutosize = React.forwardRef(function TextareaAutosize(props: TextareaAutosizeProps, ref) {
    const { onChange, rowsMax, rowsMin: rowsMinProp = 1, style, value, ...other } = props;

    const rowsMin: number = rowsMinProp;

    const { current: isControlled } = React.useRef(value != null);
    const inputRef = React.useRef(null);
    const handleRef = useForkRef(ref, inputRef) as any;
    const shadowRef = React.useRef(null);
    const renders = React.useRef(0);
    const [state, setState] = React.useState<any>({});

    const muiFormControl = useFormControl() as FormControlState;
    console.log("muiFormControl", muiFormControl);
    const onFilled = muiFormControl && muiFormControl.onFilled;
    const onEmpty = muiFormControl && muiFormControl.onEmpty;
    const checkDirty = React.useCallback(
        (obj) => {
            if (!!value) {
                if (onFilled) {
                    onFilled();
                }
            } else if (onEmpty) {
                onEmpty();
            }
        },
        [onFilled, onEmpty]
    );

    useEnhancedEffect(() => {
        if (isControlled) {
            checkDirty({ value });
        }
    }, [value, checkDirty, isControlled]);


    const syncHeight = React.useCallback(() => {
        const input = inputRef.current as any;
        const computedStyle = window.getComputedStyle(input);

        const inputShallow = shadowRef.current as any;
        inputShallow.style.width = computedStyle.width;
        inputShallow.value = input.value || props.placeholder || "x";

        const boxSizing = computedStyle["box-sizing"];
        const padding =
            getStyleValue(computedStyle, "padding-bottom") + getStyleValue(computedStyle, "padding-top");
        const border =
            getStyleValue(computedStyle, "border-bottom-width") +
            getStyleValue(computedStyle, "border-top-width");

        // The height of the inner content
        const innerHeight = inputShallow.scrollHeight - padding;

        // Measure height of a textarea with a single row
        inputShallow.value = "x";
        const singleRowHeight = inputShallow.scrollHeight - padding;

        // The height of the outer content
        let outerHeight = innerHeight;

        if (rowsMin) {
            outerHeight = Math.max(Number(rowsMin) * singleRowHeight, outerHeight);
        }
        if (rowsMax) {
            outerHeight = Math.min(Number(rowsMax) * singleRowHeight, outerHeight);
        }
        outerHeight = Math.max(outerHeight, singleRowHeight);

        // Take the box sizing into account for applying this value as a style.
        const outerHeightStyle = outerHeight + (boxSizing === "border-box" ? padding + border : 0);
        const overflow = Math.abs(outerHeight - innerHeight) <= 1;

        setState((prevState: any) => {
            // Need a large enough difference to update the height.
            // This prevents infinite rendering loop.
            if (
                renders.current < 20 &&
                ((outerHeightStyle > 0 &&
                    Math.abs((prevState.outerHeightStyle || 0) - outerHeightStyle) > 1) ||
                    prevState.overflow !== overflow)
            ) {
                renders.current += 1;
                return {
                    overflow,
                    outerHeightStyle
                };
            }

            if (process.env.NODE_ENV !== "production") {
                if (renders.current === 20) {
                    console.error(
                        [
                            "Material-UI: too many re-renders. The layout is unstable.",
                            "TextareaAutosize limits the number of renders to prevent an infinite loop."
                        ].join("\n")
                    );
                }
            }

            return prevState;
        });
    }, [rowsMax, rowsMin, props.placeholder]);

    React.useEffect(() => {
        const handleResize = debounce(() => {
            renders.current = 0;
            syncHeight();
        });

        window.addEventListener("resize", handleResize);
        return () => {
            handleResize.clear();
            window.removeEventListener("resize", handleResize);
        };
    }, [syncHeight]);

    useEnhancedEffect(() => {
        syncHeight();
    });

    React.useEffect(() => {
        renders.current = 0;
    }, [value]);

    const handleChange = (event: any) => {
        renders.current = 0;

        if (!isControlled) {
            syncHeight();
        }

        if (onChange) {
            onChange(event);
        }
    };

    return (
        <React.Fragment>
      <textarea
          value={value}
          onChange={handleChange}
          ref={handleRef}
          // Apply the rows prop to get a "correct" first SSR paint
          rows={rowsMin}
          style={{
              height: state.outerHeightStyle,
              // Need a large enough difference to allow scrolling.
              // This prevents infinite rendering loop.
              overflow: state.overflow ? "hidden" : null,
              ...style
          } as any}
          {...other}
      />
            <textarea
                aria-hidden
                className={props.className}
                readOnly
                ref={shadowRef}
                tabIndex={-1}
                style={{ ...styles.shadow, ...style } as any}
            />
        </React.Fragment>
    );
});


export interface TextareaAutosizeProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "children" | "rows"> {
    ref?: React.Ref<HTMLTextAreaElement>;

    /**
     * Maximum number of rows to display.
     */
    rowsMax?: number;
    /**
     * Minimum number of rows to display.
     */
    rowsMin?: number;
}

export default TextareaAutosize;