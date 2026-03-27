// @ts-nocheck
"use client";

import * as React from "react";
import { useRef, useLayoutEffect, useState, useCallback, useEffect } from "react";
import classNames from "classnames";
// rc-tabs 내부 모듈 (TabNavList 대체 – 네이티브 스크롤만 사용, more/operations 미사용)
import TabContext from "rc-tabs/es/TabContext";
import TabNode from "rc-tabs/es/TabNavList/TabNode";
import useRefs from "rc-tabs/es/hooks/useRefs";

export interface DockTabNavListProps {
  id: string;
  tabPosition: "top" | "bottom" | "left" | "right";
  activeKey: string;
  rtl: boolean;
  animated?: { inkBar?: boolean; tabPane?: boolean };
  extra?: React.ReactNode | { left?: React.ReactNode; right?: React.ReactNode };
  editable?: { onEdit: (type: string, info: unknown) => void; removeIcon?: React.ReactNode };
  tabBarGutter?: number;
  onTabClick: (key: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  children?: (node: React.ReactElement) => React.ReactElement;
  locale?: { removeAriaLabel?: string };
  className?: string;
  style?: React.CSSProperties;
}

function parseExtra(extra: DockTabNavListProps["extra"]): { left: React.ReactNode; right: React.ReactNode } {
  if (!extra || React.isValidElement(extra)) {
    return { left: null, right: extra ?? null };
  }
  if (typeof extra === "object" && extra !== null && ("left" in extra || "right" in extra)) {
    return { left: extra.left ?? null, right: extra.right ?? null };
  }
  return { left: null, right: extra as React.ReactNode };
}

const DockTabNavList = React.forwardRef<HTMLDivElement, DockTabNavListProps>(
  (props, ref) => {
    const {
      id,
      activeKey,
      rtl,
      animated = { inkBar: true },
      extra,
      editable,
      tabBarGutter,
      onTabClick,
      children: renderWrapper,
      locale,
      tabPosition,
      className,
      style,
    } = props;

    const context = React.useContext(TabContext);
    const tabs = context?.tabs ?? [];
    const prefixCls = context?.prefixCls ?? "dock";

    const wrapRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [getBtnRef, removeBtnRef] = useRefs();
    const [inkStyle, setInkStyle] = useState<React.CSSProperties>({});
    const rafIdRef = useRef<number>(0);

    const tabPositionTopOrBottom = tabPosition === "top" || tabPosition === "bottom";

    const updateInkBar = useCallback(() => {
      const refObj = activeKey ? getBtnRef(activeKey) : null;
      const activeBtn = refObj?.current as HTMLDivElement | null | undefined;
      if (!activeBtn) {
        setInkStyle({});
        return;
      }
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        if (tabPositionTopOrBottom) {
          setInkStyle(
            rtl
              ? { right: activeBtn.offsetLeft, width: activeBtn.offsetWidth }
              : { left: activeBtn.offsetLeft, width: activeBtn.offsetWidth }
          );
        } else {
          setInkStyle({ top: activeBtn.offsetTop, height: activeBtn.offsetHeight });
        }
      });
    }, [activeKey, tabPositionTopOrBottom, rtl, getBtnRef]);

    const onListResize = useCallback(() => {
      updateInkBar();
    }, [updateInkBar]);

    useLayoutEffect(() => {
      updateInkBar();
      return () => cancelAnimationFrame(rafIdRef.current);
    }, [updateInkBar, activeKey, tabs.map((t) => t.key).join("_")]);

    useEffect(() => {
      window.addEventListener("resize", onListResize);
      return () => window.removeEventListener("resize", onListResize);
    }, [onListResize]);

    const extraContent = parseExtra(extra);
    const extraRight = extraContent.right;

    const onTabFocus = React.useCallback(
      (key: string) => {
        const wrap = wrapRef.current;
        const tabEl = document.getElementById(`${id}-tab-${key}`);
        if (wrap && tabEl) {
          tabEl.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "auto" });
        }
      },
      [id]
    );

    const tabNodeStyle: React.CSSProperties =
      tabPositionTopOrBottom
        ? { [rtl ? "marginRight" : "marginLeft"]: tabBarGutter }
        : { marginTop: tabBarGutter };

    const tabNodes = tabs.map((tab, i) => (
      <TabNode
        id={id}
        prefixCls={prefixCls}
        key={tab.key}
        tab={tab}
        style={i === 0 ? undefined : tabNodeStyle}
        closable={tab.closable}
        editable={editable}
        active={tab.key === activeKey}
        renderWrapper={renderWrapper}
        removeAriaLabel={locale?.removeAriaLabel}
        ref={getBtnRef(tab.key) as React.RefObject<HTMLDivElement>}
        onClick={(e) => onTabClick(tab.key, e)}
        onRemove={() => removeBtnRef(tab.key)}
        onFocus={() => onTabFocus(tab.key)}
      />
    ));

    return (
      <div
        ref={ref}
        role="tablist"
        className={classNames(`${prefixCls}-nav`, className)}
        style={style}
      >
        <div className={`${prefixCls}-nav-wrap`} ref={wrapRef}>
          <div ref={listRef} className={`${prefixCls}-nav-list`}>
            {tabNodes}
            <div
              className={classNames(
                `${prefixCls}-ink-bar`,
                animated?.inkBar && `${prefixCls}-ink-bar-animated`
              )}
              style={inkStyle}
            />
          </div>
        </div>
        {extraRight ? (
          <div className={`${prefixCls}-extra-content`}>{extraRight}</div>
        ) : null}
      </div>
    );
  }
);

DockTabNavList.displayName = "DockTabNavList";

export default DockTabNavList;
