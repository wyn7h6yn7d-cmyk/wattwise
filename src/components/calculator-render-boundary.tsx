"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  calculatorName: string;
};

type State = {
  hasError: boolean;
};

export class CalculatorRenderBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Calculator render failed:", this.props.calculatorName, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-zinc-50">Kalkulaatori laadimine ebaõnnestus</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Selle kalkulaatori vaate renderdamisel tekkis viga: {this.props.calculatorName}.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

